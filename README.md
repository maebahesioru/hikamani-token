# Hikamani Coin (HMC)

ヒカマニ・ヒカマー界隈のコミュニティトークン。Solana(SPL Token-2022)上で発行。

- **ティッカー:** HMC
- **総供給量:** 1,000,000,000 HMC(固定供給・増刷不可)
- **decimals:** 18
- **チェーン:** Solana(SPL Token-2022)
- **ローンチ方式:** フェアローンチ + renounce(所有権放棄)
- **理念:** 嫌儲思想に反しない設計(無断転載禁止・販売で儲けない・透明性)

## 構成

```
hikamani-coin/
├── WHITEPAPER.md        # ホワイトペーパー
├── assets/
│   ├── hmc_logo.png     # ロゴ(卵様モチーフ・オリジナル)
│   └── metadata.json    # オンチェーンメタデータ
├── scripts/
│   ├── create-wallets.js  # ウォレット生成
│   ├── fund-wallets.js    # フォーセットからSOL送金(ローカル検証用)
│   ├── create-token.js    # Token-2022ミント作成+配分+renounce
│   └── make_logo.py       # ロゴ生成(PIL)
└── keys/                  # 秘密鍵(絶対に公開しない・git管理外)
```

## 使い方

### 1. 依存関係
```bash
npm install @solana/web3.js @solana/spl-token @solana/spl-token-metadata
```

### 2. ウォレット作成
```bash
node scripts/create-wallets.js
```

### 3. トークン作成(ローカル検証バリデータ)
```bash
# バリデータ起動(フォーセットの公開鍵を--mintに指定)
solana-test-validator --ledger .ledger --mint <FAUCET_PUBKEY> --reset

# フォーセットからSOL送金
node scripts/fund-wallets.js http://127.0.0.1:8899

# トークン作成(ミント+メタデータ+配分+renounce)
node scripts/create-token.js http://127.0.0.1:8899 <METADATA_URI>
```

### 4. devnet/mainnetでの実行
同じスクリプトをRPC URLとメタデータURIを変えて実行するだけ。
devnetのSOLはフォーセット(faucet.solana.com)から入手。

## トークノミクス

| 項目 | 数量 | 割合 |
|---|---|---|
| コミュニティ報酬プール | 500,000,000 HMC | 50% |
| 運営・開発リザーブ | 200,000,000 HMC | 20% |
| 初期エアドロップ・配布 | 300,000,000 HMC | 30% |

## セキュリティ注意

- `keys/` ディレクトリと `addresses.json` は**絶対に公開しない**(git管理外・.gitignore済み)
- シードフレーズや秘密鍵をチャット・サイトに入力しない
- 本番発行時は必ずテストネットで検証してから行う

## 免責

本プロジェクトはコミュニティの遊び・サービス利用のためのユーティリティトークンであり、投資勧誘ではありません。
