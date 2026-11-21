# Graph View 比較実験

Streamlitとブラウザ内のJavaScriptで、練習1問と本番5問の回答、回答時間、自信度を記録します。本番データはPythonで検証・採点し、最後に非公開のGoogle Sheetsへ1セッション1行で保存します。

## 開発プレビュー

Python 3.12で確認しています。リポジトリのルートで次を実行します。fish、zsh、bashのいずれでも、仮想環境のPythonを直接使えます。

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m streamlit run streamlit_app.py
```

Streamlitが表示するURLをPCのブラウザで開きます。プレビューは合成画像とデモ用のGroup割当を使い、結果を `.study-data/preview.sqlite3` に保存します。回答途中に再読み込みしても同じタブで復帰できます。グループ選択時に学籍番号の入力が必要で、回答には `user_id` として記録されます。同じ学籍番号の複数回答を自動で拒否する機能はありません。

画像をブラウザでデコードしてから開始ボタンを有効にします。画像・設問・選択肢の初回描画に合わせて計時し、有効な回答確定で停止します。タブが非表示になったりフォーカスを失ったりした場合は別途記録します。回答中の再読み込みは中断として記録し、同じ問題の確認画面へ戻ります。

ローカルに配置した画像と仮の設問を使う場合は、`STUDY_CONFIG_DIR` に2つの設定JSONがあるフォルダを指定します。`ready_for_participants` は `false` のままで構いません。確認用の設問・選択肢・解説には `tmp-` を付けておくと、正式版に置き換える箇所が分かります。画面には「動作確認」と表示され、通常のプレビューと同じSQLiteに保存されます。

```sh
env STUDY_MODE=preview STUDY_CONFIG_DIR=study-private .venv/bin/python -m streamlit run streamlit_app.py
```

## 本番設定

1. 研究担当者から設定例を受け取り、`study-private/study-config.json` と `study-private/answer-key.json` を作ります。正式な設問・選択肢・出典・時刻・正解、練習解説、描画アルゴリズム名、最小viewportとversionを設定します。案内文は任意の `introduction`（文字列の配列）、A〜Dの追加文言は各設問の `option_labels`（IDから文字列への対応）で差し替えられます。
2. 正式画像16枚を `static/assets/` に配置します。設定の `image_path` は `static/` からの相対パスです。同一問題の3条件は同じ画像寸法にします。SHA-256は起動時に計算し、設定値があれば照合します。画像そのものの読める大きさ、内容、正解の整合は実施端末で研究者が確認してください。
3. 非公開のスプレッドシートで専用タブを作り、1行目に次のヘッダーを置きます。シートをサービスアカウントに編集者として共有し、Google CloudプロジェクトでSheets APIを有効にします。

   ```csv
   submission_id,payload_sha256,study_version,group_id,received_at_utc,responses_json
   ```

4. ホスト側のStreamlit Secretsに次を設定します。ローカルで本番接続を試す場合は `.streamlit/secrets.toml` を使います。

   ```toml
   [study_sheets]
   spreadsheet_id = "スプレッドシートURLの /d/ の後にあるID"
   sheet_id = 0 # 対象タブの gid

   [google_service_account]
   # Google Cloudで発行したサービスアカウントJSONの各項目をTOMLで設定
   ```

5. 実施前に `ready_for_participants=true` を設定し、HTTPSの公開先を用意します。起動は `env STUDY_MODE=production .venv/bin/python -m streamlit run streamlit_app.py` です。設定を別の非公開ディレクトリに置く場合は `STUDY_CONFIG_DIR` で指定できます。設定や画像を更新したら該当versionを上げて再起動し、参加者募集から回収まで同じversionを運用します。

本番正解表とGoogle認証情報はサーバー側に置きます。公開アセットに入れるのは刺激画像だけです。参加者側の保存成功表示はSheetsの応答、または同一内容の保存済み行の確認後に出ます。

### Streamlit Community Cloudで本番にする

Community Cloudの **App settings → Secrets** で、本番モードと2つのJSONを1つのTOMLに設定します。下の `{}` はそれぞれ完成したJSONファイルの全文に置き換えてください。三重のシングルクォートで囲むと、JSON内の二重引用符やバックスラッシュをそのまま貼れます。

```toml
STUDY_MODE = "production"

[study_files]
config_json = '''
{}
'''
answer_key_json = '''
{}
'''
```

`STUDY_MODE` は **最初の `[セクション名]` より前** に置きます。同じTOMLに既存の `[study_sheets]` と `[google_service_account]` を残してください。`[study_files]` が設定されていない場合、本番モードでは従来どおり `study-private/` のJSONを読みます。

正式画像16枚はデプロイ先の `static/assets/` に必要です。正解表と認証情報はCloudのSecretsにだけ置き、リポジトリに入れないでください。テスト用のタブで送信を確認してから本番のタブIDに切り替えます。

Sheetsでは `submission_id` に対応する名前付き範囲の登録と回答行の追加を一括更新します。同一IDが既にあれば行の追加も失敗し、サーバーが保存済み行の内容を照合します。受け付け中は記録タブの行や `submission_` で始まる名前付き範囲を編集・削除しないでください。最初の本番利用前に、テスト用シートで同時送信と応答喪失後の再送を確認してください。

本番設定のSheets:
https://docs.google.com/spreadsheets/d/19mcWAPMtFesaaaJDEaMJDX8gG0qB9IhztPsM_XfN9zA/edit

## 研究者用CSV

対象タブをGoogle SheetsからCSVとしてダウンロードし、次を実行します。練習を除いた本番回答を1件1行で展開します。各行に `user_id`（学籍番号）も出力します。追加前の回答では空欄です。元のセッションJSONには練習と中断の記録も残ります。

```sh
.venv/bin/python export_trials.py session-responses.csv main-trials.csv
.venv/bin/python export_trials.py .study-data/preview.sqlite3 preview-trials.csv
```
