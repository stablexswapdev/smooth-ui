var token_balance;
var token_supply;

async function update_balances() {
    var default_account = (await web3.eth.getAccounts())[0];
    if (default_account) {
        for (let i = 0; i < N_COINS; i++)
            wallet_balances[i] = parseInt(await coins[i].methods.balanceOf(default_account).call());
        token_balance = parseInt(await old_swap_token.methods.balanceOf(default_account).call());
    }
    for (let i = 0; i < N_COINS; i++)
        balances[i] = parseInt(await old_swap.methods.balances(i).call());
    token_supply = parseInt(await old_swap_token.methods.totalSupply().call());
}

function handle_change_amounts(i) {
    return function() {
        for (let j = 0; j < N_COINS; j++) {
            var cur = $('#currency_' + j);
            if ((this.value > (balances[i] * c_rates[i] * token_balance / token_supply)) & (j == i))
                cur.css('background-color', 'red')
            else
                cur.css('background-color', 'blue');
            cur.css('color', 'aqua');
        }
        var share = $('#liquidity-share');
        share.val('---');
        share.css('background-color', '#707070');
        share.css('color', '#d0d0d0');
    }
}

function handle_change_share() {
    var share = $('#liquidity-share');
    var val = share.val();

    share.css('background-color', 'blue');
    share.css('color', 'aqua');
    if (val == '---') {
        share.val('0.0');
        val = 0;
    }
    else if ((val > 100) | (val < 0))
        share.css('background-color', 'red');

    for (let i = 0; i < N_COINS; i++) {
        var cur = $('#currency_' + i);
        if ((val >=0) & (val <= 100))
            cur.val((val / 100 * balances[i] * c_rates[i] * token_balance / token_supply).toFixed(2))
        else
            cur.val('0.00');
        cur.css('background-color', '#707070');
        cur.css('color', '#d0d0d0');
    }
}


async function handle_remove_liquidity() {
    var share = $('#liquidity-share');
    var share_val = share.val();
    var deadline = Math.floor((new Date()).getTime() / 1000) + trade_timeout;
    var amounts = $("[id^=currency_]").toArray().map(x => $(x).val());
    for (let i = 0; i < N_COINS; i++)
        amounts[i] = cBN(Math.floor(amounts[i] / c_rates[i]).toString()).toFixed(0,1); // -> c-tokens
    var min_amounts = amounts.map(x => cBN(Math.floor(0.97 * x).toString()).toFixed(0,1));
    var txhash;
    var default_account = (await web3.eth.getAccounts())[0];
    if (share_val == '---') {
        await old_swap.methods.remove_liquidity_imbalance(amounts, deadline).send({from: default_account, gas: 1000000});
    }
    else {
        var amount = cBN(Math.floor(share_val / 100 * token_balance).toString()).toFixed(0,1);
        if (share_val == 100)
            amount = await old_swap_token.methods.balanceOf(default_account).call();
        await old_swap.methods.remove_liquidity(amount, deadline, min_amounts).send({from: default_account, gas: 600000});
    }
    if(share_val != '---') {
        for (let i = 0; i < N_COINS; i++) {
            handle_change_amounts(i)();
        }
    }
    await update_balances();
    update_fee_info('old');
}

function init_ui() {
    for (let i = 0; i < N_COINS; i++) {
        $('#currency_' + i).focus(handle_change_amounts(i));
        $('#currency_' + i).on('input', handle_change_amounts(i));
    }
    $('#liquidity-share').focus(handle_change_share);
    $('#liquidity-share').on('input', handle_change_share);

    handle_change_share();
    update_fee_info('old');

    $("#remove-liquidity").click(handle_remove_liquidity);
    $("#migrate-new").click(() => {
        handle_migrate_new('old');
    });
}

window.addEventListener('load', async () => {
    try {
        await init();
        await update_rates('old');
        await update_balances();
        init_ui();
    }
    catch(err) {
        console.error(err)
        if(err.reason == 'cancelDialog') {     
            const web3 = new Web3(infura_url);
            window.web3 = web3

            await init_contracts();
            await update_rates('old');
            await update_balances();
            init_ui();
        }
    }
});
