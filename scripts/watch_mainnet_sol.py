# mainnet SOL着金監視+自動発行
# 5分おきにE89qnp...の残高を確認し、SOLが届いたらdeploy_mainnet.shを実行
import subprocess, time, json, os, sys, datetime, urllib.request

RPC = "https://api.mainnet-beta.solana.com"
BASE = r"C:\Users\maeba\Downloads\crypto_create_research\hikamani-coin"
TREASURY = "E89qnpMgQXX7gz8Rp1d5BRRnbw285Xhdpa4nvvEuLdxi"
LOG = os.path.join(BASE, "watch_mainnet.log")
MAX_HOURS = 24
INTERVAL = 180  # 3分

def log(msg):
    line = "[%s] %s" % (datetime.datetime.now().strftime("%H:%M:%S"), msg)
    print(line, flush=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def get_balance(addr):
    req = urllib.request.Request(RPC, data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": "getBalance", "params": [addr]}).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)["result"]["value"]

def main():
    start = time.time()
    while time.time() - start < MAX_HOURS * 3600:
        try:
            bal = get_balance(TREASURY)
            sol = bal / 1e9
            log("残高: %.6f SOL" % sol)
            if bal >= 10000000:  # 0.01 SOL以上
                log("SOL着金確認(%.6f SOL) → mainnet発行開始" % sol)
                rc = subprocess.call(["bash", os.path.join(BASE, "scripts", "deploy_mainnet.sh")], cwd=BASE)
                log("deploy_mainnet.sh exit=%d" % rc)
                if rc == 0:
                    log("mainnet発行完了")
                    return 0
                log("発行失敗(ログ確認)")
                return 1
        except Exception as e:
            log("チェック例外: %s" % str(e)[:100])
        time.sleep(INTERVAL)
    log("24時間経過・SOL着金なし")
    return 2

if __name__ == "__main__":
    sys.exit(main())