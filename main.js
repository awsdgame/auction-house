// Auction House Game - main.js
// This script handles the core functionality of the auction house game, including auction management, bidding,
    // Cached DOM
    const auctionContainer = document.getElementById('auctionContainer');
    const inventoryContainer = document.getElementById('inventoryContainer');
    const balanceEl = document.getElementById('balance'); // right column
    const balanceDisplay = document.getElementById('balanceDisplay'); // header
    const activeCount = document.getElementById('activeCount');
    const historyLog = document.getElementById('historyLog');
    const bidModal = document.getElementById('bidModal');
    const modalItemName = document.getElementById('modalItemName');
    const modalCurrentPrice = document.getElementById('modalCurrentPrice');
    const modalBalance = document.getElementById('modalBalance');
    const bidAmount = document.getElementById('bidAmount');
    const bidError = document.getElementById('bidError');

    // Game state (core gameplay kept intact)
    let balance = 500;
    let auctions = [];
    let inventory = [];
    let selectedAuctionIndex = null;

    const items = [
      { name: 'Antique Vase', base: 50 },
      { name: 'Rare Painting', base: 120 },
      { name: 'Vintage Watch', base: 90 },
      { name: 'Gemstone Ring', base: 150 },
      { name: 'Old Coin', base: 30 }
    ];

    function formatMoney(n){return n.toLocaleString(undefined, {maximumFractionDigits:0})}

    function addHistory(text){
      const entry = document.createElement('div');
      entry.className = 'history-item';
      entry.textContent = text;
      historyLog.prepend(entry);
    }

    function createAuction(item=null){
      const product = item || items[Math.floor(Math.random()*items.length)];
      const duration = 15; // seconds
      auctions.push({
        name: product.name,
        price: product.base,
        highestBidder: 'AI',
        timeLeft: duration,
        initialTime: duration,
        img: 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(product.name)
      });
    }

    function spawnInitialAuctions(){
      createAuction();createAuction();createAuction();
    }

    function renderAuctions(){
      auctionContainer.innerHTML = '';
      auctions.forEach((auction, index)=>{
        const card = document.createElement('div');
        card.className = 'auction-card';

        const thumb = document.createElement('div');thumb.className='thumb';
        const img = document.createElement('img');img.src=auction.img;img.alt=auction.name;thumb.appendChild(img);

        const meta = document.createElement('div');meta.className='meta';
        const title = document.createElement('h4');title.textContent = auction.name;meta.appendChild(title);
        const bidder = document.createElement('div');bidder.className='bidder';bidder.textContent = auction.highestBidder;meta.appendChild(bidder);

        const priceRow = document.createElement('div');priceRow.className='price';
        const priceText = document.createElement('strong');priceText.textContent = '$' + formatMoney(auction.price);
        const timeText = document.createElement('div');timeText.style.fontSize='0.9rem';timeText.style.color='var(--muted)';timeText.textContent = auction.timeLeft + 's';
        priceRow.appendChild(priceText);priceRow.appendChild(timeText);

        const timebar = document.createElement('div');timebar.className='timebar';
        const bar = document.createElement('i');
        const pct = Math.max(0, (auction.timeLeft / auction.initialTime) * 100);
        bar.style.width = pct + '%';
        timebar.appendChild(bar);

        const actions = document.createElement('div');actions.className='card-actions';
        const bidBtn = document.createElement('button');bidBtn.className='btn primary';bidBtn.textContent='Place Bid';bidBtn.onclick = ()=> openBidModal(index);
        const quickBtn = document.createElement('button');quickBtn.className='btn';quickBtn.textContent='+10 Bid';quickBtn.onclick = ()=> quickBid(index, 10);
        actions.appendChild(bidBtn);actions.appendChild(quickBtn);

        card.appendChild(thumb);card.appendChild(meta);card.appendChild(priceRow);card.appendChild(timebar);card.appendChild(actions);

        auctionContainer.appendChild(card);
      });
      activeCount.textContent = auctions.length;
    }

    function renderInventory(){
      inventoryContainer.innerHTML = '';
      if(inventory.length===0){inventoryContainer.innerHTML='<div style="color:var(--muted)">No items</div>';return}
      inventory.forEach((it, idx)=>{
        const d = document.createElement('div');d.className='inv-item';
        const name = document.createElement('div');name.textContent = it.name;name.style.fontWeight='600';
        const val = document.createElement('div');val.textContent = 'Value: $' + formatMoney(it.base);val.style.color='var(--muted)';
        const sell = document.createElement('button');sell.className='btn warn';sell.textContent='Sell';sell.onclick = ()=> sellItem(idx);
        d.appendChild(name);d.appendChild(val);d.appendChild(sell);
        inventoryContainer.appendChild(d);
      });
    }

    function openBidModal(index){
      selectedAuctionIndex = index;
      const auction = auctions[index];
      modalItemName.textContent = auction.name;
      modalCurrentPrice.textContent = auction.price;
      modalBalance.textContent = balance;
      bidAmount.value = auction.price + 1;
      bidError.style.display='none';
      bidModal.classList.add('open');
      bidAmount.focus();
    }

    function closeModal(){
      bidModal.classList.remove('open');
      selectedAuctionIndex = null;
    }

    function confirmBid(){
      const bid = Math.floor(Number(bidAmount.value));
      const auction = auctions[selectedAuctionIndex];
      if(!Number.isFinite(bid) || bid <= 0){showError('Enter a valid bid.');return}
      if(bid <= auction.price){showError('Bid must be greater than current price.');return}
      if(bid > balance){showError('Insufficient balance for this bid.');return}
      auction.price = bid;auction.highestBidder = 'You';
      renderAuctions();
      closeModal();
    }

    function showError(text){bidError.textContent = text;bidError.style.display='block'}

    function quickBid(index, inc){
      const a = auctions[index];
      const newBid = a.price + inc;
      if(newBid > balance){ addHistory('Quick bid failed: insufficient funds for ' + a.name); return }
      a.price = newBid; a.highestBidder = 'You';
      renderAuctions();
    }

    function sellItem(index){
      const item = inventory[index];
      const sellPrice = item.base + Math.floor(Math.random()*50);
      balance += sellPrice; updateBalance();
      addHistory(`Sold ${item.name} for $${sellPrice}`);
      inventory.splice(index,1); renderInventory();
    }

    function updateAuctions(){
      for(let i=auctions.length-1;i>=0;i--){
        const auction = auctions[i];
        auction.timeLeft -= 1;
        // AI bidding behaviour kept
        if(auction.highestBidder === 'AI' && Math.random() > 0.6){
          auction.price += Math.floor(Math.random()*15) + 5;
        }

        if(auction.timeLeft <= 0){
          if(auction.highestBidder === 'You'){
            balance -= auction.price; updateBalance();
            addHistory(`You won ${auction.name} for $${auction.price}`);
            inventory.push({ name: auction.name, base: auction.price }); renderInventory();
          } else {
            addHistory(`${auction.name} sold to AI for $${auction.price}`);
          }
          auctions.splice(i,1);
          createAuction();
        }
      }
      renderAuctions();
    }

    function updateBalance(){
      balanceEl.textContent = '$' + formatMoney(balance);
      balanceDisplay.textContent = '$' + formatMoney(balance);
      modalBalance.textContent = balance;
    }

    // Event listeners
    document.getElementById('confirmBidBtn').addEventListener('click', ()=> confirmBid());
    document.getElementById('closeModal').addEventListener('click', ()=> closeModal());
    document.getElementById('newAuctionBtn').addEventListener('click', ()=> { createAuction(); renderAuctions(); });
    bidModal.addEventListener('click', (e)=>{ if(e.target === bidModal) closeModal(); });
    window.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeModal(); if(e.key === 'Enter' && bidModal.classList.contains('open')) confirmBid(); });

    // Init
    updateBalance(); spawnInitialAuctions(); renderAuctions(); renderInventory();
    setInterval(updateAuctions, 1000);
