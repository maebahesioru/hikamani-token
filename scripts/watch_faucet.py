# フォーセット監視+自動devnet発行
# 5分おきにrequestAirdropを試し、成功したらdeploy_devnet.shを実行
import subprocess, time, json, sys, os, datetime

RPC = "https://api.devnet.solana.com"
BASE = r"C:\Users\maeba\Downloads\crypto_create_research\hikamani-coin"
ADDRS = os.path.join(BASE, "devnet_addresses.json")
LOG = os.path.join(BASE, "watch_faucet.log")
MAX_HOURS = 24
INTERVAL = 300  # 5分

def log(msg):
    line = "[%s] %s" % (datetime.datetime.now().strftime("%H:%M:%S"), msg)
    print(line, flush=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def check_balance(addr):
    import urllib.request
    req = urllib.request.Request(RPC, data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": "getBalance", "params": [addr]}).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.load(r)["result"]["value"]

def request_airdrop(addr):
    import urllib.request
    req = urllib.request.Request(RPC, data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": "requestAirdrop", "params": [addr, 2000000000]}).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)

def main():
    addrs = json.load(open(ADDRS, encoding="utf-8"))
    treasury = addrs["treasury"]
    start = time.time()
    attempts = 0
    while time.time() - start < MAX_HOURS * 3600:
        attempts += 1
        try:
            bal = check_balance(treasury)
            if bal >= 1000000:
                log("SOL確認済み %.2f SOL → devnet発行開始" % (bal / 1e9))
                # 固定スクリプトパスをbashで実行(ユーザー入力なし・shell=False)
                rc = subprocess.call(["bash", os.path.join(BASE, "scripts", "deploy_devnet.sh")], cwd=BASE)
                log("deploy_devnet.sh exit=%d" % rc)
                if rc == 0:
                    log("devnet発行完了")
                    return 0
                else:
                    log("発行失敗(再試行はしません。ログ確認)")
                    return 1
            else:
                try:
                    res = request_airdrop(treasury)
                    if "error" not in res:
                        log("airdrop成功!(%d回目) %s" % (attempts, res.get("result", "")))
                        continue
                    err = res["error"].get("message", "")
                    log("airdrop失敗(%d回目): %s" % (attempts, err[:100]))
                except Exception as e:
                    log("airdrop例外(%d回目): %s" % (attempts, str(e)[:100]))
        except Exception as e:
            log("チェック例外: %s" % str(e)[:100])
        time.sleep(INTERVAL)
    log("タイムアウト(%d時間) フォーセット復活せず" % MAX_HOURS)
    return 2

if __name__ == "__main__":
    sys.exit(main())
