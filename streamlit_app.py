"""Streamlit entry point. Data sent to the component is explicitly public."""
import logging
import os
from pathlib import Path

import streamlit as st
from streamlit.errors import StreamlitSecretNotFoundError

from study_config import ROOT, load_study
from study_store import PreviewStore, SheetsStore, validate_submission

LOGGER = logging.getLogger(__name__)
UI = ROOT / "study_ui"


@st.cache_data
def study_settings(mode, config_dir, cloud_json):
    return load_study(mode, config_dir, cloud_json)


def save(submission, mode):
    if mode == "preview":
        PreviewStore(Path(os.environ.get("STUDY_PREVIEW_DB", ROOT / ".study-data/preview.sqlite3"))).save(submission)
        return
    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build

    settings = st.secrets["study_sheets"]
    credentials = Credentials.from_service_account_info(
        dict(st.secrets["google_service_account"]),
        scopes=["https://www.googleapis.com/auth/spreadsheets"],
    )
    api = build("sheets", "v4", credentials=credentials, cache_discovery=False)
    SheetsStore(api, settings["spreadsheet_id"], int(settings["sheet_id"])).save(submission)


def main():
    st.set_page_config(page_title="グラフの比較実験 / Graph Comparison Study", layout="wide")
    config_dir = Path(os.environ.get("STUDY_CONFIG_DIR", ROOT / "study-private"))
    try:
        mode = os.environ.get("STUDY_MODE")
        if mode is None:
            try:
                mode = st.secrets.get("STUDY_MODE", "preview")
            except StreamlitSecretNotFoundError:
                mode = "preview"
        cloud_json = None
        if mode == "production":
            files = st.secrets.get("study_files")
            if files is not None:
                cloud_json = (files["config_json"], files["answer_key_json"])
            if not st.get_option("server.enableStaticServing"):
                raise ValueError("Static serving must be enabled")
            if not st.secrets["study_sheets"]["spreadsheet_id"] or not st.secrets["google_service_account"]:
                raise ValueError("Missing Google Sheets settings")
            int(st.secrets["study_sheets"]["sheet_id"])
        study, answers, algorithms = study_settings(mode, config_dir, cloud_json)
    except Exception:
        LOGGER.exception("Study startup validation failed")
        st.error("実験を開始できません。研究担当者へご連絡ください。\n\n"
                 "The study could not be started. Please contact the researcher.")
        return

    component = st.components.v2.component(
        "graph_view_study",
        html='<div id="study-root"></div>',
        css=(UI / "study.css").read_text(),
        js=(UI / "study.js").read_text(),
    )

    def submit():
        event = st.session_state.experiment.get("submit")
        if not isinstance(event, dict) or not isinstance(event.get("request_id"), str):
            return
        ok = False
        try:
            submission = validate_submission(event["payload"], study, answers, algorithms)
            save(submission, mode)
            ok = True
        except Exception as error:
            # Do not log participant payloads or API request bodies.
            LOGGER.warning("Study submission failed (%s)", type(error).__name__)
        st.session_state.study_receipt = {"request_id": event["request_id"], "ok": ok}
        if ok and event.get("reduce_motion") is not True:
            st.session_state.show_submission_balloons = True

    component(key="experiment", data={"study": study, "receipt": st.session_state.get("study_receipt")},
              on_submit_change=submit, width="stretch")
    if st.session_state.pop("show_submission_balloons", False):
        st.balloons()


main()
