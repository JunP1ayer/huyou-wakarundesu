# CI 版 SemVer ガード & 再発防止手順

## 背景
`npm ci` で `npm ERR! Invalid Version:` が発生することがあった。原因は package-lock.json
に SemVer ではない文字列（例: "", "v1.0.0", "workspace:*"）が混入したため。

## 対策
1. **CI で自動検知**  
   - `.github/scripts/validate-semver.js` が lock を走査し、無効なバージョンを検知すると PR を強制失敗させる。
2. **npm 10 以上を使用**  
   - `workspace:*` プロトコルが必要な場合でも npm 10 なら正しく解釈する。
3. **ローカルフローの統一**  
   ```bash
   rm -rf node_modules package-lock.json
   npm install         # lock を再生成
   git add package-lock.json
   ```

4. **トラブルシューティング**
   * ローカル再現: `npm ci --legacy-peer-deps --verbose`
   * エラー行の文字列をもとに grep で該当ファイルを特定