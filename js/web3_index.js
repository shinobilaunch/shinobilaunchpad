var web3 = null;
var tempWeb3 = null;
var currentAddr;
var networkID = 0;
var contractLaunchpad = null;

var rate = 0;
var hardcap = 0;
var deposit = 0;
var enddate = 0;

var releasedate = 0;

window.addEventListener('load', () => {
    //Reset
    currentAddr = null;
    contractLaunchpad = null;

    web3 = null;
    tempWeb3 = null;

    mainContractInfo();
    countdown();
    Connect();
})

function showAlert(msg, type) {
    if (type == 'error') {
        iziToast.error({
            title: 'Error',
            message: msg,
            backgroundColor: 'white',
            position: 'topRight',
            color: '.iziToast-color-red',
            iconColor: '.iziToast-color-red'
        });
    }
    if (type == 'success') {
        iziToast.success({
            title: 'Success!',
            message: msg,
            backgroundColor: 'white',
            position: 'topRight',
            progressBarColor: '#76BF73',
            color: '.iziToast-#76BF73',
            iconColor: '.iziToast-#76BF73'
        });
    }
}


async function mainContractInfo() {
    if (NETID == 1) {
        web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/ce2b58aaa0004d57926f977ccd579e39"));
    } else if (NETID == 3) {
        web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/v3/ce2b58aaa0004d57926f977ccd579e39"));
    } else {
        web3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545');
    }
    contractLaunchpad = await new web3.eth.Contract(ABI_LAUNCHPAD, ADDRESS_LAUNCHPAD);
    contractLaunchpad.methods.tiers(3).call().then(res => {
        if(res != null && res != undefined){
            $("#your-max-deposit").text((res.maxDeposit/1e18).toFixed(1) + " eth");
            $("#your-min-deposit").text((res.minDeposit/1e18).toFixed(1) + " eth");
        }
    })
    
    update();
}

async function Connect() {
    if (window.ethereum) {
        tempWeb3 = new Web3(window.ethereum)
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" })
            let accounts = await window.ethereum.request({ method: 'eth_accounts' })
            currentAddr = accounts[0]
            window.ethereum.on('chainChanged', (chainId) => {
                window.location.reload();
            });
            window.ethereum.on('accountsChanged', function (accounts) {
                window.location.reload();
            });

            getCurrentWallet();
            runAPP();
            return;
        } catch (error) {
            console.error(error)
        }
    }
}


async function runAPP() {
    networkID = await tempWeb3.eth.net.getId()
    console.log("NetID: " + networkID)
    if (networkID == NETID) {
        web3 = tempWeb3;
        $("#info-network").text("Connected to ETH mainnet");
        contractLaunchpad = await new web3.eth.Contract(ABI_LAUNCHPAD, ADDRESS_LAUNCHPAD);
        update()
    } else {
        $("#info-network").text("Wrong network! Change to ETH");

        if (window.ethereum) {
            const data = [{ chainId: '0x1', }];
            /* eslint-disable */
            const tx = await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: data }).catch()
            if (tx) {
                console.log(tx)
            }
        }
    }
}


$("#btn-connect-metamask").click(() => {
    if (window.ethereum) {
        Connect();
    } else {
        showAlert("Please install Metamask first", "error");
    }
})

$("#btn-connect-trust").click(() => {
    if (window.ethereum) {
        Connect();
    } else {
        showAlert("Please install Trust wallet and open the website on Trust/DApps", "error");
    }
})

$("#btn-connect-wlconnect").click(async() => {
    var WalletConnectProvider = window.WalletConnectProvider.default;
    var walletConnectProvider = new WalletConnectProvider({
        infuraId: "ce2b58aaa0004d57926f977ccd579e39",
        rpc: {
            1: "https://mainnet.infura.io/v3/ce2b58aaa0004d57926f977ccd579e39",
        },
        chainId: 1,
    });
    await walletConnectProvider.enable();

    tempWeb3 = new Web3(walletConnectProvider);
    var accounts = await web3.eth.getAccounts();
    currentAddr = accounts[0];
    var connectedAddr = currentAddr[0] + currentAddr[1] + currentAddr[2] + currentAddr[3] + currentAddr[4] + currentAddr[5] + '...' + currentAddr[currentAddr.length - 6] + currentAddr[currentAddr.length - 5] + currentAddr[currentAddr.length - 4] + currentAddr[currentAddr.length - 3] + currentAddr[currentAddr.length - 2] + currentAddr[currentAddr.length - 1]
    $("#btn-connect1").css("display", "none")
    $("#btn-connect2").css("display", "none")
    $("#your-info-wrap").css("display", "block");
    $("#your-address").text(connectedAddr);

    walletConnectProvider.on("chainChanged", (chainId) => {
        window.location.reload();
    });

    walletConnectProvider.on("accountsChanged", (chainId) => {
        window.location.reload();
    });

    walletConnectProvider.on("disconnect", (code, reason) => {
        console.log(code, reason);
        window.location.reload();
    });

    runAPP()
})

async function getCurrentWallet() {
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
            currentAddr = accounts[0]
            var connectedAddr = currentAddr[0] + currentAddr[1] + currentAddr[2] + currentAddr[3] + currentAddr[4] + currentAddr[5] + '...' + currentAddr[currentAddr.length - 6] + currentAddr[currentAddr.length - 5] + currentAddr[currentAddr.length - 4] + currentAddr[currentAddr.length - 3] + currentAddr[currentAddr.length - 2] + currentAddr[currentAddr.length - 1]
            $("#btn-connect1").css("display", "none")
            $("#btn-connect2").css("display", "none")
            $("#your-info-wrap").css("display", "block");
            $("#your-address").text(connectedAddr);
        }
    }
}

async function updateParameters() {
    if (contractLaunchpad) {
        contractLaunchpad.methods._CAP_HARD().call().then(res => {
            hardcap = (res/1e18).toFixed(1);
            $("#info-hardcap").text(hardcap);
            if(deposit > 0){
                var progress = (deposit/hardcap).toFixed(0); 
                $("#info-progress").css("width", progress + "%");
            }
        })
        contractLaunchpad.methods._TOTAL_DEPOSIT().call().then(res => {
            deposit = (res/1e18).toFixed(1);
            console.log("deposit = " + deposit);
            $("#info-total-deposit").text(deposit);
            if(hardcap > 0){
                var progress = (deposit/hardcap).toFixed(0); 
                $("#info-progress").css("width", progress + "%");
            }
        })
        contractLaunchpad.methods._RATE().call().then(res => {
            rate = res;
            $("#input-eth").attr("placeholder", "1 eth = " + res + " snu");
        })

        contractLaunchpad.methods._TIME_END().call().then(res => {
            enddate = res * 1000; // Time in js is milisecond
        })

        contractLaunchpad.methods._TIME_RELEASE().call().then(res => {
            releasedate = res;

            var nextClaimDate = new Date(releasedate * 1000);
            var hour = nextClaimDate.getHours();
            var min = nextClaimDate.getMinutes();
            var date = nextClaimDate.getDate();
            var month = nextClaimDate.getMonth() + 1;
            var year = nextClaimDate.getFullYear();
            $("#info-time-release").text(date + "/" + month + "/" + year + " - " + hour + ":" + min);
        })

        contractLaunchpad.methods._PUBLIC_SALE().call().then(res => {
            if(res == true){
                $("#your-whitelist-info").text("The sale is open publicly")
                contractLaunchpad.methods.tiers(0).call().then(res0 => {
                    if(res != null && res != undefined){
                        $("#your-max-deposit").text((res0.maxDeposit/1e18).toFixed(1) + " eth");
                        $("#your-min-deposit").text((res0.minDeposit/1e18).toFixed(1) + " eth");
                    }
                })
            }else {
                if(currentAddr != null && currentAddr != undefined){
                    contractLaunchpad.methods.userInfo(currentAddr).call().then(res1 => {
                        var yourTier = res1.tier;
                        if(yourTier == 0){
                            $("#your-whitelist-info").text("your address isn't whitelisted");
                            $("#your-whitelist-info-img").attr("src","images/error.png");
                            
                        }else{
                            $("#your-whitelist-info").text("your address is whitelisted");
                            $("#your-whitelist-info-img").attr("src","images/stick.png");

                            contractLaunchpad.methods.tiers(yourTier).call().then(res2 => {
                                if(res != null && res != undefined){
                                    $("#your-max-deposit").text((res2.maxDeposit/1e18).toFixed(1) + " eth");
                                    $("#your-min-deposit").text((res2.minDeposit/1e18).toFixed(1) + " eth");
                                }
                            })
                        }

                        $("#your-deposit").text((res1.deposit/1e18).toFixed(2) + " ETH");
                        $("#your-token").text(((res1.deposit/1e18) * rate) + " SNU");
                    })
                }
            }
        })
    }
}


function countdown() {
    const updateTime = () => {
        // Get todays date and time
        const now = new Date().getTime();
        // Find the distance between now an the count down date
        var distance = enddate - now;

        // Time calculations for days, hours, minutes and seconds
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // If the count down is over, write some text 
        if (distance < 0) {
            $("#info-timeleft").text("0 days 00:00:00");
        } else {
            var timeLeftText = days + " days " + addZero(hours) + ":" + addZero(minutes) + ":" + addZero(seconds);
            $("#info-timeleft").text(timeLeftText);
        }
        requestAnimationFrame(updateTime);
    }
    updateTime();
}
const addZero = (x) => (x < 10 && x >= 0) ? "0" + x : x;


function update() {
    console.log("Update");
    updateParameters();
}
setInterval(update, 5000)



$("#btn-contribute").click(() => {
    if(currentAddr == null || currentAddr == undefined || contractLaunchpad == null){
        showAlert("Please connect your wallet first", "error");
        return;
    }

    try {
        if (contractLaunchpad && currentAddr != null && currentAddr != undefined) {
            var amount = document.getElementById("input-eth").value * 1e18;
            contractLaunchpad.methods.deposit().send({
                value: amount,
                from: currentAddr,
            })
        }
    } catch (error) {}
})

$("#btn-claim").click(() => {
    if(currentAddr == null || currentAddr == undefined || contractLaunchpad == null){
        showAlert("Please connect your wallet first", "error");
        return;
    }

    const now = new Date().getTime();
    if(now < releasedate * 1000){
        showAlert("Please wait till release time", "error");
        return;
    }

    try {
        if (contractLaunchpad && currentAddr != null && currentAddr != undefined) {
            contractLaunchpad.methods.claim().send({
                value: 0,
                from: currentAddr,
            })
        }
    } catch (error) {}
})