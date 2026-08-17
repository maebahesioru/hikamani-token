# HMC 秘密鍵バックアップ手順書(最重要)

**この手順書はHMCの全資産を守るためのものです。必ず実施してください。**

---

## 1. 何が危険か

HMCの運用キー(mainnet-keys/)は**このPCの中にだけ**あります。このPCが故障・盗難・紛失すると、**HMCの全資産(報酬プール5億・運営2億・エアドロ3億)に永遠にアクセスできなくなります。** renounce済みのため再発行も不可能です。

## 2. バックアップ対象(4つのキー)

| ロール | 役割 | ファイル |
|---|---|---|
| Treasury | 金庫・SOL管理 | `mainnet-keys/treasury.json` |
| Reward | 報酬プール(5億HMC) | `mainnet-keys/reward.json` |
| Ops | 運営(2億HMC) | `mainnet-keys/ops.json` |
| Airdrop | エアドロ(3億HMC) | `mainnet-keys/airdrop.json` |

各ファイルは**64個の数字(秘密鍵)**です。

## 3. バックアップ手順(推奨: 紙 + USB)

### 方法A: 紙に書く(最強・オフライン)
1. このPCで `mainnet-keys/` の中身を開く
2. 各ファイルの**64個の数字を、そのまま紙に書き写す**(4ファイル分)
3. 書いた紙を**2箇所以上**(自宅+信頼できる場所)に分けて保管
4. PC上のファイルは消さない(両方持つ)

### 方法B: 暗号化USB
1. USBメモリを用意
2. `mainnet-keys/` フォルダごとUSBにコピー
3. USB自体にパスワードロック(USB暗号化ソフト)をかける
4. USBは自宅で保管

### 方法C: 暗号化ZIP
1. `mainnet-keys/` をZIPに圧縮
2. **強力なパスワードを設定**(20文字以上・数字+英字+記号)
3. そのZIPをクラウド(Google Drive等)にアップロード
4. パスワードは紙に書いて保管(クラウドには書かない)

## 4. 絶対にやってはいけないこと

- ❌ 秘密鍵をDiscord・X・メール・チャットに送る
- ❌ 秘密鍵をGitHub等の公開リポジトリに上げる(万一上げた場合は即座に漏洩扱い)
- ❌ 秘密鍵をスクリーンショットで共有する
- ❌ パスワードを鍵と同じ場所に置く

## 5. バックアップの検証

1. バックアップ後、`solana address --keypair <バックアップしたファイル>` が正しいアドレスを表示するか確認
   - treasury → `E89qnpMgQXX7gz8Rp1d5BRRnbw285Xhdpa4nvvEuLdxi`
   - reward → `EUF7yrVKqBCmyzaZRWLiuC9iJ1hFSD1feWbe17txvqRr`
   - ops → `5n46Saahxu1w7TnSSsH367bUSVbp3tZdxHyXpYGF9LMA`
   - airdrop → `9DFBv6oZ461aFDhbUobZ1rvoSWkL5rd2HniGCMeUn8nX`
2. 一致すればバックアップ成功

## 6. もしPCが壊れたら

1. 紙/USBからキーを復元(新しいPCでJSONファイルを作り直す)
2. `solana address` でアドレス一致を確認
3. 復元できたキーでHMC運用再開

---
**実施したら「バックアップ完了」って教えてください。管理台帳に記録します。**
