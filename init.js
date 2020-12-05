let cancelablePromise;
$(document).click(function(event) { 
  $target = $(event.target);
  if(!$target.closest('.web3connect-provider-wrapper').length && 
  $('.web3connect-provider-wrapper').is(":visible") && cancelablePromise && (!window.web3provider || (window.web3provider && window.web3provider.version != '1.0.0-beta.34'))) {
    cancelablePromise.cancel('cancelDialog');
  }        
});
async function init(type) {
    if(!type) init_menu();

    const WalletConnectProvider = window.WalletConnectProvider.default
    const providerOptions = {
        walletconnect: {
            package: WalletConnectProvider, // required
            options: {
              infuraId: "c334bb4b45a444979057f0fb8a0c9d1b" // required
            }
        },
   
    };

    const web3Connect = new Web3Connect.default.Core({
      network: "mainnet", // optional
      cacheProvider: true, // optional
      providerOptions // required
    });

    window.web3Connect = web3Connect

    const provider = web3Connect.connect();
    cancelablePromise = makeCancelable(provider);
    return cancelablePromise.then(async (provider) => {    
        provider.on && provider.on("chainChanged", (chainId) => {
            console.log(chainId, "CHAIN")
            if(chainId != 1) {
                $('#error-window').text('Error: wrong network type. Please switch to mainnet');
                $('#error-window').show();
            }
        });

        provider.on && provider.on("accountsChanged", (accounts) => {
            console.log(accounts)
            location.reload()
        })

        const web3 = new newWeb3(provider);

        window.web3provider = web3;
        window.web3 = web3

    /*    if (window.ethereum)
        {
            window.web3 = new Web3(ethereum);
            await ethereum.enable();
        }
        else
            window.web3 = new Web3(infura_url);*/
        if(!type) await init_contracts();
    })

}