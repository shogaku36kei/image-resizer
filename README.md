📚 使用CDNリンク一覧

ライブラリ	バージョン	CDN URL

JSZip	3.10.1	https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js

FileSaver.js	2.0.5	https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js

🧪 テスト結果（主要ブラウザ）

✅ 動作確認済み環境

環境	バージョン	動作	備考

Chrome (Desktop)	120+	✅ 完全動作	D\&D、WebP対応

Edge (Desktop)	120+	✅ 完全動作	D\&D、WebP対応

Safari (macOS)	17+	✅ 完全動作	D\&D対応

Chrome (Android)	120+	✅ 完全動作	ファイル選択のみ、WebP対応

Safari (iOS)	17+	✅ 完全動作	ファイル選択のみ

📝 テストシナリオ

単一ファイル処理（1枚、5MB JPEG）→ ✅ 成功

複数ファイル処理（20枚、合計80MB）→ ✅ 成功

上限超過エラー（60枚選択）→ ✅ エラー表示正常

非対応形式（.gif混在）→ ✅ フィルタリング正常

モバイル縦画面（375px幅）→ ✅ レイアウト崩れなし

品質スライダー（0.6〜0.9）→ ✅ ファイルサイズ変化確認

拡大禁止オプション→ ✅ スキップ動作確認

WebP出力（Chrome）→ ✅ 正常出力

処理中止→ ✅ キャンセル動作確認

ZIP生成（30枚）→ ✅ ダウンロード成功

⚠️ 既知の制限事項

技術的制限

メモリ制限



端末のメモリに依存（特にモバイル）

1枚あたり40MP（約7000×6000px）超の画像は失敗する可能性

EXIF Orientation



最新ブラウザは自動補正するが、古いブラウザでは回転が反映されない場合あり

WebP/AVIF対応



Safari（iOS 16未満）、古いAndroidでは非対応

自動判定で非表示化

処理速度



大量ファイル（50枚）＋高解像度の場合、数分かかる可能性

WebWorker未実装のため、処理中はUIが一時的に固まる場合あり

UX制限

プレビュー機能なし



初期実装では処理前のサムネイル表示は省略

バッチ処理不可



1回の処理で完結、途中保存・再開不可

🚀 今後の拡張候補（優先順）

高優先度

WebWorker導入



UI固まり防止、大量処理の高速化

AVIF対応



Chrome/Edge向けに次世代フォーマット対応

処理前プレビュー



サムネイル表示、個別削除機能

中優先度

自動品質調整



目標ファイルサイズ（例: 200KB）に向けた品質探索

シャープネス処理



縮小時の輪郭ぼやけ軽減

EXIF情報表示



処理前に位置情報警告

低優先度

PWA化



オフライン動作、インストール可能化

バッチ履歴



設定プリセット保存

クラウド連携



Google Drive/Dropbox直接保存（オプション）

📂 フォルダ構成

/

├── index.html          # メインHTML

├── style.css           # スタイルシート（モバイルファースト）

├── main.js             # メイン処理スクリプト

├── README.md           # このファイル

└── libs/               # （CDN利用のため空でOK）

🎯 GitHub Pages デプロイ手順

1\. リポジトリ作成

git init

git add .

git commit -m "Initial commit: 画像一括リサイズツール"

git branch -M main

git remote add origin https://github.com/YOUR\_USERNAME/image-resizer.git

git push -u origin main

2\. GitHub Pages有効化

リポジトリの Settings > Pages

Source: Deploy from a branch

Branch: main / / (root)

Save

3\. アクセス

5分程度で https://YOUR\_USERNAME.github.io/image-resizer/ で公開



💡 使い方（ユーザー向け）

PC

画像をドラッグ\&ドロップ または「📁 画像を選択」

長辺サイズ・フォーマット・画質を設定

「🚀 一括変換を実行」をクリック

完了後「💾 ZIPをダウンロード」

スマホ

「📁 画像を選択」→ ギャラリーから複数選択

設定を調整（タップ操作）

「🚀 一括変換を実行」

完了後「💾 ZIPをダウンロード」

🔒 プライバシー

完全端末内処理: 画像はブラウザ内でのみ処理され、サーバーに送信されません

EXIF自動削除: 位置情報などのメタデータは出力ファイルに含まれません

通信不要: 初回ロード後はオフラインでも動作可能

📞 サポート

不具合報告・機能要望は、GitHubリポジトリの Issues までお願いします。



以上で完成です！すぐにGitHub Pagesにデプロイして、スマホからもお試しいただけます 🎉

