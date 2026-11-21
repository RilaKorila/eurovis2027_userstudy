const versions = ["study_version", "stimulus_manifest_version", "assignment_version"];
const introduction = [
  {
    lang: "ja",
    opening: "練習1問と本番5問があります。",
    timing: "各問題で回答時間も計測しています。一問 開始したら、最後まで途切れずに受けてください。（各問題の間は少しの休憩可能ですが、長時間放置するとセッションが切れて最初からやり直しになる可能性があるのでご注意ください。）",
    steps: [
      "問題文をよく読み、選択肢 A - D の中から適切なものを選択し回答してください。",
      "その問題に対して、自分の回答に対する自信度合いを5段階で回答してください。",
    ],
    repeat: "上記の流れを、6問分繰り返します。",
    submit: "最後に「回答をまとめて送信」を押してください。",
    complete: "「回答完了しました」の文言が出れば実験完了です。",
  },
  {
    lang: "en",
    opening: "There is one practice question and five main questions.",
    timing: "Your response time is measured for each question. Once you start a question, please complete it without interruption. (You may take a short break between questions, but please note that leaving the session idle for too long may cause it to expire, requiring you to start over.)",
    steps: [
      "Read the question carefully and select the appropriate answer from options A - D.",
      "Rate your confidence in your answer to that question on a five-point scale.",
    ],
    repeat: "Repeat the steps above for all six questions.",
    submit: "Finally, press 「回答をまとめて送信」 (Submit all responses).",
    complete: "The experiment is complete when you see 「回答完了しました」 (Responses completed).",
  },
];
const trialFields = ["trial_index", "question_id", "layout_condition_id", "stimulus_id", "stimulus_sha256"];
const utc = () => new Date().toISOString();
const pick = (source, keys) => Object.fromEntries(keys.map(key => [key, source[key]]));
const viewport = () => ({
  viewport_width: window.innerWidth,
  viewport_height: window.innerHeight,
  device_pixel_ratio: window.devicePixelRatio,
});
const storageKey = study => "graph-view-study:" + JSON.stringify(versions.map(key => study[key]));

function el(tag, content, className) {
  const node = document.createElement(tag);
  if (content !== undefined) node.textContent = content;
  if (className) node.className = className;
  return node;
}

function button(label, action, disabled = false) {
  const node = el("button", label, "action");
  node.type = "button";
  node.disabled = disabled;
  node.addEventListener("click", action);
  return node;
}

function choices(name, legend, items, onChoice) {
  const group = el("fieldset");
  group.append(el("legend", legend));
  const row = el("div", undefined, "choices");
  for (const [value, text] of items) {
    const label = el("label");
    const input = el("input");
    Object.assign(input, {type: "radio", name, value});
    input.addEventListener("change", () => onChoice(value));
    label.append(input, el("span", text));
    row.append(label);
  }
  group.append(row);
  return group;
}

function start(root, study, emit) {
  const key = storageKey(study);
  let state;
  let requestId;
  let latestRequestId;
  let timeout;
  let completionTimeout;
  let timedStart;
  let disposed = false;
  let renderId = 0;
  let frame;
  let failed = false;
  let storageError = false;

  function save() {
    if (storageError) return false;
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
      return true;
    } catch {
      storageError = true;
      stopTiming();
      root.replaceChildren(el("p", "回答を保持できません。研究担当者へご連絡ください。", "error"));
      return false;
    }
  }

  function stopTiming() {
    timedStart = undefined;
    if (frame !== undefined) cancelAnimationFrame(frame);
    document.removeEventListener("visibilitychange", visibility);
    window.removeEventListener("blur", blur);
  }

  try {
    state = JSON.parse(sessionStorage.getItem(key) || "null");
    if (!state) {
      state = {screen: "group", index: 0, trials: [], aborted_attempts: [],
               participant_id: crypto.randomUUID(), session_id: crypto.randomUUID(),
               submission_id: crypto.randomUUID(), started_at_utc: utc(),
               environment: {user_agent: navigator.userAgent, ...viewport()}};
    }
    if (state.screen === "question") {
      if (state.active) {
        state.aborted_attempts.push({...state.active, status: "aborted_reload", aborted_at_utc: utc()});
      }
      delete state.active;
      state.screen = "confirm";
    }
    // Resume sessions saved on the old rest screen after their confidence was recorded.
    if (state.screen === "break") state.screen = afterMainTrial();
    if (state.screen === "submit" && state.payload) failed = true;
    if (!state.user_id && !["group", "done", "user_id"].includes(state.screen)) {
      state.resume_screen = state.screen;
      state.screen = "user_id";
    }
  } catch {
    root.replaceChildren(el("p", "実験を開始できません。ブラウザの設定をご確認ください。", "error"));
    return {update() {}, dispose() {}};
  }

  function go(screen) {
    state.screen = screen;
    if (save()) render();
  }

  function afterMainTrial() {
    if (state.index === state.assignment.length - 1) return "submit";
    state.index += 1;
    return "confirm";
  }

  function log(kind) {
    if (timedStart === undefined || state.screen !== "question" || !state.active) return;
    state.active.attention_events.push({kind, at_utc: utc(), elapsed_ms: performance.now() - timedStart});
    save();
  }

  function visibility() {
    if (document.hidden) log("hidden");
  }

  function blur() {
    log("blur");
  }

  function trialTitle() {
    return state.index === 0 ? "練習問題" : `本番 第${state.index}問 / 全${state.assignment.length - 1}問`;
  }

  function currentTrial() {
    return state.assignment[state.index];
  }

  function fitsViewport() {
    return innerWidth >= study.minimum_viewport[0] && innerHeight >= study.minimum_viewport[1];
  }

  function confirm(panel, generation) {
    panel.append(el("p", "準備ができたら開始してください。"));
    const status = el("p", "", "muted");
    status.setAttribute("role", "status");
    let loaded = false;
    let error = false;
    let image;
    const begin = button("問題を開始する", () => {
      if (!loaded || !fitsViewport() || state.screen !== "confirm") return;
      state.screen = "question";
      if (save()) showQuestion(image);
    }, true);
    const retry = button("画像の読み込みを再試行", load);
    panel.append(status, begin, retry);

    function statusUpdate() {
      if (disposed || renderId !== generation || storageError) return;
      begin.disabled = !loaded || !fitsViewport();
      retry.hidden = !error;
      if (error) status.textContent = "画像を読み込めませんでした。";
      else if (!fitsViewport()) {
        status.textContent = `表示領域を ${study.minimum_viewport.join(" × ")} ピクセル以上にしてください。`;
      } else status.textContent = loaded ? "" : "画像を読み込んでいます…";
    }

    async function load() {
      loaded = error = false;
      statusUpdate();
      image = new Image();
      image.alt = "前後2時刻のグラフ";
      image.src = currentTrial().image_url;
      try {
        await image.decode();
        loaded = true;
      } catch {
        error = true;
      }
      statusUpdate();
    }

    window.addEventListener("resize", statusUpdate);
    removeResize = () => window.removeEventListener("resize", statusUpdate);
    load();
  }

  function showQuestion(image) {
    const trial = currentTrial();
    const panel = layout(trialTitle(), false);
    panel.style.visibility = "hidden";
    panel.append(el("p", trial.prompt, "prompt"), el("p", trial.definition, "muted"), image);
    let answer;
    const next = button("回答を確定して次へ", () => {
      if (!answer || timedStart === undefined || state.screen !== "question" || next.disabled) return;
      const end = performance.now();
      next.disabled = true;
      state.trials.push({...state.active, selected_option_id: answer, response_time_ms: end - timedStart,
                         answer_confirmed_at_utc: utc()});
      delete state.active;
      stopTiming();
      go("confidence");
    }, true);
    panel.append(choices("answer", "回答", trial.option_ids.map(option => [
      option, trial.option_labels[option] ? `${option}　${trial.option_labels[option]}` : option,
    ]), value => {
      answer = value;
      next.disabled = timedStart === undefined;
    }), next);

    function reveal() {
      if (disposed || state.screen !== "question" || storageError) return;
      if (document.hidden) {
        frame = requestAnimationFrame(reveal);
        return;
      }
      if (!fitsViewport()) {
        go("confirm");
        return;
      }
      const size = image.getBoundingClientRect();
      const attempts = state.aborted_attempts.filter(record => record.trial_index === state.index).length;
      state.active = {...pick(trial, trialFields), image_shown_at_utc: utc(),
        attempt_index: attempts + 1, attention_events: [],
        image_natural_width: image.naturalWidth, image_natural_height: image.naturalHeight,
        image_rendered_width: size.width, image_rendered_height: size.height, ...viewport()};
      if (!save()) return;
      document.addEventListener("visibilitychange", visibility);
      window.addEventListener("blur", blur);
      timedStart = performance.now();
      panel.style.visibility = "visible";
      panel.querySelector("h1").focus({preventScroll: true});
    }
    frame = requestAnimationFrame(reveal);
  }

  function send() {
    if (requestId) return;
    if (state.payload && !state.payload.user_id) state.payload.user_id = state.user_id;
    if (!state.payload) {
      state.payload = {...pick(study, versions),
        ...pick(state, ["session_id", "participant_id", "submission_id", "user_id", "group_id", "started_at_utc",
                        "environment", "trials", "aborted_attempts"]), submitted_at_utc: utc()};
    }
    if (!save()) return;
    requestId = crypto.randomUUID();
    const submitted = latestRequestId = requestId;
    render();
    timeout = window.setTimeout(() => {
      if (requestId === submitted) fail();
    }, 25_000);
    try {
      emit("submit", {request_id: submitted, payload: state.payload,
        reduce_motion: matchMedia("(prefers-reduced-motion: reduce)").matches});
    } catch {
      fail();
    }
  }

  function fail() {
    clearTimeout(timeout);
    requestId = undefined;
    failed = true;
    render();
  }

  function update(nextEmit, receipt) {
    emit = nextEmit;
    if (!receipt || latestRequestId !== receipt.request_id || state.screen !== "submit") return;
    latestRequestId = undefined;
    if (!receipt.ok) {
      fail();
      return;
    }
    clearTimeout(timeout);
    requestId = undefined;
    // Retain the completion marker and group after the save is acknowledged.
    state = {screen: "done", submission_id: state.submission_id, group_id: state.group_id};
    if (!save()) return;
    const panel = layout("回答を保存しました");
    panel.classList.add("completion-splash");
    const mark = el("span", "✓", "completion-mark");
    mark.setAttribute("aria-hidden", "true");
    panel.prepend(mark);
    completionTimeout = window.setTimeout(render, 1500);
  }

  let removeResize = () => {};
  function layout(title, focusHeading = true) {
    removeResize();
    removeResize = () => {};
    ++renderId;
    const header = el("header", "グラフの比較実験");
    if (study.preview) header.append(el("span", "開発プレビュー", "preview"));
    const h = el("h1", title);
    h.tabIndex = -1;
    const panel = el("section", undefined, "panel");
    panel.append(h);
    root.replaceChildren(header);
    if (state.group_id && state.screen !== "group") {
      root.append(el("p", `選択グループ：Group ${state.group_id}`, "selected-group muted"));
    }
    root.append(panel);
    if (focusHeading) h.focus({preventScroll: true});
    return panel;
  }

  function render() {
    switch (state.screen) {
      case "group":
      case "user_id": {
        const returning = state.screen === "user_id";
        const panel = layout(returning ? "学籍番号の入力" : "参加グループ");
        panel.append(el("p", returning ? "学籍番号を入力してください。" : "学籍番号を入力し、事前に指定されたグループを選んでください。"));
        const label = el("label", undefined, "student-id-label");
        const input = el("input");
        Object.assign(input, {type: "text", id: "student-id", maxLength: 128, value: state.user_id || "", autocomplete: "off"});
        label.htmlFor = input.id;
        label.append(el("span", "学籍番号"), input);
        const error = el("p", "半角数字で入力してください", "error");
        error.id = "student-id-error";
        error.hidden = true;
        input.setAttribute("aria-describedby", error.id);
        let selected;
        const next = button(returning ? "続ける" : "説明へ", () => {
          state.user_id = input.value.trim();
          if (returning) {
            const resume = state.resume_screen;
            delete state.resume_screen;
            go(resume);
          } else {
            state.group_id = selected;
            state.assignment = study.groups[selected];
            go("instructions");
          }
        }, true);
        const refresh = () => {
          const invalid = input.value !== "" && !/^[0-9]+$/.test(input.value);
          error.hidden = !invalid;
          input.setAttribute("aria-invalid", String(invalid));
          next.disabled = !input.value || invalid || (!returning && !selected);
        };
        input.addEventListener("input", refresh);
        panel.append(label, error);
        if (!returning) {
          panel.append(choices("group", "グループ", ["A", "B", "C"].map(id => [id, "Group " + id]),
                               value => { selected = value; refresh(); }));
        }
        panel.append(next);
        refresh();
        break;
      }
      case "instructions": {
        const panel = layout("実験の説明");
        for (const [index, section] of introduction.entries()) {
          if (index) panel.append(el("hr"));
          const content = el("div", undefined, "introduction");
          content.lang = section.lang;
          const steps = el("ol");
          for (const line of section.steps) steps.append(el("li", line));
          const final = el("p", section.submit);
          final.append(el("br"), document.createTextNode(section.complete));
          content.append(el("p", section.opening), el("p", section.timing), steps,
            el("p", section.repeat), final);
          panel.append(content);
        }
        const back = button("グループを変更", () => go("group"));
        back.classList.add("secondary");
        panel.append(button("練習へ", () => go("confirm")), back);
        break;
      }
      case "confirm": {
        const panel = layout(trialTitle());
        confirm(panel, renderId);
        break;
      }
      case "confidence": {
        const panel = layout(trialTitle());
        let rating;
        const next = button("次へ", () => {
          state.trials.at(-1).confidence = rating;
          go(state.index === 0 ? "feedback" : afterMainTrial());
        }, true);
        panel.append(choices("confidence", study.confidence.prompt,
          [...study.confidence.options].reverse().map(({value, label}) => [value, label]), value => {
            rating = value;
            next.disabled = false;
          }), next);
        break;
      }
      case "feedback": {
        const panel = layout("練習の解説");
        const retry = button("練習問題やり直す", () => {
          state.trials.pop();
          state.aborted_attempts = state.aborted_attempts.filter(record => record.trial_index !== 0);
          go("confirm");
        });
        retry.classList.add("secondary");
        panel.append(el("p", `正解は ${study.practice_feedback.answer} です。`, "prompt"),
          el("p", study.practice_feedback.explanation),
          button("本番へ", () => { state.index = 1; go("confirm"); }), retry);
        break;
      }
      case "submit": {
        const panel = layout("送信確認");
        panel.append(el("p", "本番5問の回答と自信度が揃いました。送信して終了してください。"),
          el("p", `Group ${state.group_id} ／ 練習1問・本番5問`));
        const status = el("p", requestId ? "保存完了を待っています…" : failed ?
          "保存の完了を確認できませんでした。回答は保持されています。再送信してください。" : "",
        failed && !requestId ? "error" : "muted");
        status.setAttribute("role", "status");
        panel.append(status, button(requestId ? "送信中…" : failed ? "再送信" : "回答をまとめて送信",
          send, Boolean(requestId)));
        break;
      }
      case "done":
        layout("回答完了しました").append(el("p", "ご協力ありがとうございました。"));
        break;
    }
  }

  if (save()) render();
  return {update, dispose() {
    disposed = true;
    clearTimeout(timeout);
    clearTimeout(completionTimeout);
    stopTiming();
    removeResize();
  }};
}

export default function ({parentElement, data, setTriggerValue}) {
  const root = parentElement.querySelector("#study-root");
  if (!root.study) root.study = start(root, data.study, setTriggerValue);
  root.study.update(setTriggerValue, data.receipt);
  return () => {
    root.study?.dispose();
    delete root.study;
  };
}
