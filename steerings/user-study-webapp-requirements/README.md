# 実装agentへの引継ぎ

まず`requirements.md`を読み、このdirectoryのファイルを新しいrepositoryへコピーしてください。これはWebアプリ実装ではなく要件と設定の雛形です。

- `requirements.md`: 画面、割当、計時、保存、受入条件。
- `study-config.example.json`: 練習1問＋本番5問、Group A〜C、3描画条件の設定例。
- `answer-key.example.json`: サーバー専用の正解設定例。正解はまだ未設定。
- `assignment.csv`: 初期の15行の割当表。

1人あたりは練習1問＋本番5問。画像は本番5問×3条件＝15枚と共通練習1枚を想定しています。各Groupで問題ごとに描画条件を入れ替えることはユーザー確認済みです。

技術スタック・保存先は実装agentが最小構成を選んでよく、Streamlit＋Spreadsheetでも構いません。計時はクライアントの単調時計を使い、最後に1セッション分をまとめて送信してください。

画像・設問・正解の正式な5問はこのpackageには含まれません。推測せず研究者から受け取り、実装はplaceholderの開発previewから進めてください。`ready_for_participants=false`のまま本番実施しないでください。

自信度5件法、練習の正誤解説、初期のQ1→Q5固定順などは本要件書で置いた初期仕様です。研究者が変更する場合は、画像・割当・正解・versionを整合させて実験開始前に固定してください。
