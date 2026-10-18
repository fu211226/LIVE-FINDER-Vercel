LIVE FINDER - Vercel移行用パッケージ

このZIPはNetlify FunctionsをVercelの/api/*.js形式へ移植した試作版です。

公開方法（GitHub経由）:
1. https://github.com/new で新しいRepositoryを作成（Public/Privateどちらでも可）。
2. ZIPを展開し、中のファイルと api フォルダをRepositoryへアップロードしてCommit。
3. https://vercel.com/ でGitHub連携し、Import ProjectからRepositoryを選ぶ。
4. Framework PresetはOther、Build Commandは空欄、Output Directoryは ./ のままDeploy。
5. 公開URLを開き、配信情報の読み込み、カテゴリ、通知、ダークモードを確認。

注意:
- Netlifyを止める前のサイト機能を維持することを目指した移行用です。実際のSHOWROOM API応答やHLS再生は公開後に動作確認が必要です。
- Vercel Hobbyプランの利用条件・関数制限は変更される場合があります。無料利用の適格性を確認してください。
- HLS中継は転送量や実行時間の制限に影響される可能性があり、長時間の再生・録画用途には適さない場合があります。
- 既存Netlifyサイトは、Vercel側の確認が完了するまで削除しないでください。
