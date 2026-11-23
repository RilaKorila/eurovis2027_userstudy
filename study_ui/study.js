const versions = ["study_version", "stimulus_manifest_version", "assignment_version"];
const connectionNote = "※ ここでは「つながる」は、2つのコミュニティを直接結ぶ線（エッジ）が少なくとも1本あることを指します。";
const introduction = [
  {
    lang: "ja",
    opening: "練習1問と本番6問があります。",
    timing: "各問題で回答時間も計測しています。一問 開始したら、最後まで途切れずに受けてください。（各問題の間は少しの休憩可能ですが、長時間放置するとセッションが切れて最初からやり直しになる可能性があるのでご注意ください。）",
    steps: [
      "問題文をよく読み、選択肢 A - D の中から適切なものを選択し回答してください。",
      "その問題に対して、自分の回答に対する自信度合いを5段階で回答してください。",
    ],
    repeat: "上記の流れを、6問分繰り返します。",
    submit: "最後に「回答をまとめて送信」を押してください。",
    complete: "「送信が完了しました。」の文言が出れば実験完了です。",
  },

];
// Translate visible text in place so switching languages never restarts a timed trial
// or clears an answer already selected by the participant.
const english = {
  [connectionNote]: "Note: Here, “connected” means that at least one edge directly links the two communities.",
  "グラフの比較実験": "Graph Comparison Study",
  "開発プレビュー": "Development preview",
  "練習問題": "Practice question",
  "準備ができたら開始してください。": "Start when you are ready.",
  "問題を開始する": "Start question",
  "画像の読み込みを再試行": "Retry loading image",
  "画像を読み込めませんでした。": "The image could not be loaded.",
  "画像を読み込んでいます…": "Loading image…",
  "前後2時刻のグラフ": "Graphs at two consecutive time points",
  "回答を確定して次へ": "Confirm answer and continue",
  "回答": "Answer",
  "回答を保存しました": "Your responses have been saved",
  "学籍番号の入力": "Enter your student ID",
  "参加グループ": "Participant group",
  "学籍番号を入力してください。": "Please enter your student ID.",
  "学籍番号を入力し、事前に指定されたグループを選んでください。": "Enter your student ID and select the group assigned to you.",
  "学籍番号": "Student ID",
  "半角数字で入力してください": "Enter numbers using digits 0–9.",
  "続ける": "Continue",
  "説明へ": "Continue to instructions",
  "グループ": "Group",
  "実験の説明": "Study instructions",
  "グループを変更": "Change group",
  "練習問題へ": "Continue to practice",
  "次へ": "Next",
  "練習問題の解説": "Practice question feedback",
  "練習問題をやり直す": "Retry practice question",
  "本番へ": "Continue to main questions",
  "送信確認": "Confirm submission",
  "本番6問の回答と自信度が揃いました。送信して終了してください。": "You have answered all six main questions and rated your confidence. Submit your responses to finish.",
  "保存完了を待っています…": "Waiting for confirmation…",
  "保存の完了を確認できませんでした。回答は保持されています。再送信してください。": "Could not confirm that your responses were saved. Your responses are retained. Please submit again.",
  "送信中…": "Submitting…",
  "再送信": "Submit again",
  "回答をまとめて送信": "Submit all responses",
  "回答完了しました": "Responses submitted",
  "送信完了": "Submission complete",
  "送信が完了しました。ご協力ありがとうございました。": "Your responses have been submitted. Thank you for participating.",
  "ご協力ありがとうございました。": "Thank you for participating.",
  "回答を保持できません。研究担当者へご連絡ください。": "Your responses could not be retained. Please contact the researcher.",
  "実験を開始できません。ブラウザの設定をご確認ください。": "The study could not be started. Please check your browser settings.",
  "練習1問と本番6問があります。": "There is one practice question and six main questions.",
  "各問題で回答時間も計測しています。一問 開始したら、最後まで途切れずに受けてください。（各問題の間は少しの休憩可能ですが、長時間放置するとセッションが切れて最初からやり直しになる可能性があるのでご注意ください。）": "Your response time is measured for each question. Once you start a question, please complete it without interruption. You may take a short break between questions, but a long period of inactivity may end your session and require you to start over.",
  "問題文をよく読み、選択肢 A - D の中から適切なものを選択し回答してください。": "Read each question carefully and select the appropriate answer from options A–D.",
  "その問題に対して、自分の回答に対する自信度合いを5段階で回答してください。": "Rate your confidence in your answer on a five-point scale.",
  "上記の流れを、6問分繰り返します。": "Repeat these steps for all six questions.",
  "最後に「回答をまとめて送信」を押してください。": "Finally, select “Submit all responses.”",
  "「送信が完了しました。」の文言が出れば実験完了です。": "The study is complete when “Your responses have been submitted” appears.",
  "左の図でPとつながり、右の図でX・Yの両方とつながるコミュニティは、A〜Dのどれですか？": "Which community, A–D, is connected to P in the left graph and to both X and Y in the right graph?",
  "左の図でPとつながり、右の図でX・Yの片方だけとつながるコミュニティは、A〜Dのどれですか？": "Which community, A–D, is connected to P in the left graph and to only one of X and Y in the right graph?",
  "左右の図は、連続する2つのタイムスタンプのグラフを表しています。左の図のコミュニティXは、次のタイムスタンプを表す右の図では、XとYの2つに分裂しています。": "The left and right graphs represent two consecutive time points. Community X in the left graph splits into X and Y in the right graph, which represents the next time point.",
  "左右の図は、連続する2つのタイムスタンプのグラフを表しています。": "The left and right graphs represent two consecutive time points.",
  "左右の図は、連続する2つのタイムスタンプのグラフを表しています。左の図のコミュニティPは、右の図ではXとYの2つに分裂しています。左右で同じ記号がふられているコミュニティは、隣り合うタイムスタンプにおいて同一のコミュニティです。": "The left and right graphs represent two consecutive time points. Community P in the left graph splits into X and Y in the right graph. Communities marked with the same symbol on the left and right are the same community at consecutive time points.",
  "左右の図は、連続する2つのタイムスタンプのグラフを表しています。左の図のコミュニティXとYは、右の図ではPに統合されています。左右で同じ記号がふられているコミュニティは、隣り合うタイムスタンプにおいて同一のコミュニティです。": "The left and right graphs represent two consecutive time points. Communities X and Y in the left graph merge into P in the right graph. Communities marked with the same symbol on the left and right are the same community at consecutive time points.",
  "2010年にX・Yの少なくとも片方と直接つながり、2011年に統合後のPとも直接つながるコミュニティは、A〜Dのどれですか？": "Which community, A–D, is directly connected to at least one of X and Y in 2010 and also directly connected to the merged community P in 2011?",
  "左ではDとPの間に線があります。右ではDとX、DとYの間に線があります。": "In the left graph, there is a line between D and P. In the right graph, there are lines between D and X and between D and Y.",
  "後の時刻（t1）で、Pと線で直接つながっているノードはどれですか？": "At the later time point (t1), which node is directly connected to P by a line?",
  "つながる：異なるコミュニティの所属ノード間に線が1本以上あること。": "Connected means that at least one line joins nodes belonging to different communities.",
  "\"つながる\"の定義: 異なるコミュニティの所属ノード間に線が1本以上あること。": "“Connected” means that at least one line joins nodes belonging to different communities.",
  "t1で、Pから伸びている線の先を確認してください。": "At t1, check where the line from P leads.",
  "今の回答に、どのくらい自信がありますか？": "How confident are you in your answer?",
  "まったく自信がない": "Not at all confident",
  "あまり自信がない": "Not very confident",
  "どちらともいえない": "Neither confident nor unconfident",
  "やや自信がある": "Somewhat confident",
  "とても自信がある": "Very confident"
};
function englishText(text) {
  if (Object.hasOwn(english, text)) return english[text];
  let match = text.match(/^本番 第(\d+)問 \/ 全(\d+)問$/);
  if (match) return `Main question ${match[1]} of ${match[2]}`;
  match = text.match(/^選択グループ：Group (.+)$/);
  if (match) return `Selected group: Group ${match[1]}`;
  match = text.match(/^表示領域を (.+) ピクセル以上にしてください。$/);
  if (match) return `Please make the viewport at least ${match[1]} pixels.`;
  match = text.match(/^正解は (.+) です。$/);
  if (match) return `The correct answer is ${match[1]}.`;
  match = text.match(/^Group (.+) ／ 練習1問・本番6問$/);
  if (match) return `Group ${match[1]} / 1 practice question and 6 main questions`;
  return text;
}
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
  let language = "ja";
  try { language = sessionStorage.getItem("graph-view-language") === "en" ? "en" : "ja"; } catch { /* Preference is optional. */ }
  const originals = new WeakMap();
  function translate() {
    root.lang = language;
    root.querySelectorAll(".introduction").forEach(content => { content.lang = language; });
    root.querySelector(".languages")?.setAttribute("aria-label", language === "en" ? "Language" : "言語");
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const previous = originals.get(node);
      if (!previous || (node.data !== previous.ja && node.data !== previous.en)) {
        originals.set(node, {ja: node.data, en: englishText(node.data)});
      }
      const text = originals.get(node)[language];
      if (node.data !== text) node.data = text;
    }
    root.querySelectorAll("img").forEach(image => {
      image.alt = language === "en" ? "Graphs at two consecutive time points" : "前後2時刻のグラフ";
    });
    root.querySelectorAll("[data-language]").forEach(control => {
      control.setAttribute("aria-pressed", String(control.dataset.language === language));
    });
  }
  const observer = new MutationObserver(translate);
  observer.observe(root, {subtree: true, childList: true, characterData: true});

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
    panel.append(el("p", trial.definition, "muted"), el("p", trial.prompt, "prompt"),
      el("p", connectionNote, "muted"), image);
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
    const languages = el("nav", undefined, "languages");
    for (const code of ["ja", "en"]) {
      const control = button(code.toUpperCase(), () => {
        language = code;
        try { sessionStorage.setItem("graph-view-language", code); } catch { /* Preference is optional. */ }
        translate();
      });
      control.dataset.language = code;
      control.lang = code;
      languages.append(control);
    }
    header.append(languages);
    const h = el("h1", title);
    h.tabIndex = -1;
    const panel = el("section", undefined, "panel");
    panel.append(h);
    root.replaceChildren(header);
    if (state.group_id && state.screen !== "group") {
      root.append(el("p", `選択グループ：Group ${state.group_id}`, "selected-group muted"));
    }
    root.append(panel);
    translate();
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
        for (const section of introduction) {
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
        const actions = el("div", undefined, "split-actions");
        actions.append(button("練習問題へ", () => go("confirm")), back);
        panel.append(actions);
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
        const panel = layout("練習問題の解説");
        const retry = button("練習問題をやり直す", () => {
          state.trials.pop();
          state.aborted_attempts = state.aborted_attempts.filter(record => record.trial_index !== 0);
          go("confirm");
        });
        retry.classList.add("secondary");
        const actions = el("div", undefined, "split-actions");
        actions.append(button("本番へ", () => { state.index = 1; go("confirm"); }), retry);
        const {answer, explanation} = study.practice_feedback;
        const detail = explanation.replace(/^正解は\s*([A-D])\s*です。\s*/,
          (prefix, option) => option === answer ? "" : prefix);
        panel.append(el("p", `正解は ${answer} です。`, "prompt"), el("p", detail), actions);
        break;
      }
      case "submit": {
        const panel = layout("送信確認");
        panel.append(el("p", "本番6問の回答と自信度が揃いました。送信して終了してください。"),
          el("p", `Group ${state.group_id} ／ 練習1問・本番6問`));
        const status = el("p", requestId ? "保存完了を待っています…" : failed ?
          "保存の完了を確認できませんでした。回答は保持されています。再送信してください。" : "",
        failed && !requestId ? "error" : "muted");
        status.setAttribute("role", "status");
        panel.append(status, button(requestId ? "送信中…" : failed ? "再送信" : "回答をまとめて送信",
          send, Boolean(requestId)));
        break;
      }
      case "done":
        layout("送信完了").append(el("p", "送信が完了しました。ご協力ありがとうございました。"));
        break;
    }
  }

  if (save()) render();
  return {update, dispose() {
    disposed = true;
    observer.disconnect();
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
