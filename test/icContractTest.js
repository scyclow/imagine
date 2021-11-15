
const { expect } = require("chai")

const expectFailure = async (fn, err) => {
  let failure
  try {
    await fn()
  } catch (e) {
    failure = e
  }
  expect(failure.message).to.include(err)
}

const num = n => Number(ethers.utils.formatEther(n))

describe('ImagineCoin', () => {
  it('should work', async () => {
    const [
      _, __,
      treasurer,
      tokenHolder1,
      tokenHolder2,
      tokenHolder3,
      ...signers
    ] = await ethers.getSigners()


    const ImagineCoin = await ethers.getContractFactory('ImagineCoin', treasurer)
    const ImagineCoinContract = await ImagineCoin.deploy()

    await ImagineCoinContract.deployed()

    const mintPrice = '0.0001'
    const tokensToMint = ethers.utils.parseEther('100')
    const txValue = ethers.utils.parseEther(String(tokensToMint * Number(mintPrice)))

    console.log((await treasurer.getBalance()).toString())
    await ImagineCoinContract.connect(tokenHolder1).mint(tokensToMint, { value: ethers.utils.parseEther(mintPrice) })
    await ImagineCoinContract.connect(tokenHolder2).mint(tokensToMint, { value: ethers.utils.parseEther(mintPrice) })

    await ImagineCoinContract.connect(tokenHolder1).burn(ethers.utils.parseEther('1'))
    await ImagineCoinContract.connect(tokenHolder1).transfer(tokenHolder2.address, ethers.utils.parseEther('10'))
    await ImagineCoinContract.connect(tokenHolder1).approve(tokenHolder3.address, ethers.utils.parseEther('1'))
    await ImagineCoinContract.connect(tokenHolder3).transferFrom(tokenHolder1.address, tokenHolder2.address, ethers.utils.parseEther('1'))

    expectFailure(
      () => ImagineCoinContract.connect(tokenHolder3).transferOwnership(tokenHolder3.address),
      'Only owner'
    )


    const filter = ImagineCoinContract.filters.ImagineTransfer()

    const transferEvents = await ImagineCoinContract.queryFilter({
      address: '0x663F3ad617193148711d28f5334eE4Ed07016602',
      topics: []
    })

    const topics = transferEvents.topics


    console.log((await treasurer.getBalance()).toString())

    const stateMachine = new StateMachine(transferEvents)


    console.log(stateMachine.balances['0x90F79bf6EB2c4f870365E785982E1f101E93b906'].div('1000000000000000000').toString())
    console.log(stateMachine.balances['0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'].div('1000000000000000000').toString())
    console.log(stateMachine.allowances['0x90F79bf6EB2c4f870365E785982E1f101E93b906']['0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'].div('1000000000000000000').toString())
  })
})


class StateMachine {
  mintPrice = ethers.utils.parseEther('0.0001');
  maxTokens = ethers.utils.parseEther('1000000');
  events = [];
  tokensMinted = ethers.utils.parseEther('0')

  balances = {};
  allowances = {};

  constructor(events) {
    this.events = events
    events.forEach(e => {
      switch (e.event) {
        case 'ImagineMint': return this.mint(...e.args)
        case 'ImagineBurn': return this.burn(...e.args)
        case 'ImagineTransfer': return this.transfer(...e.args)
        case 'ImagineApprove': return this.approve(...e.args)
      }
    })
  }

  mint(caller, amount, txValue) {
    if (amount.mul(this.mintPrice).lt(txValue)) return
    if (amount.add(this.tokensMinted).gt(this.maxTokens)) return

    this.tokensMinted = this.tokensMinted.add(amount)

    if (this.balances[caller]) {
      this.balances[caller] = this.balances[caller].add(amount)
    } else {
      this.balances[caller] = amount
    }
  }

  burn(caller, amount) {
    if ((this.balances[caller]||ethers.utils.parseEther('0')).lt(amount)) return
    this.balances[caller] = this.balances[caller].sub(amount)
  }

  transfer(caller, from, to, value) {
    if (
      !(
        caller === from ||
        (this.allowances?.[from]?.[caller] || ethers.utils.parseEther('0')).lte(value)
      )
    ) {
      return
    }
    if ((this.balances[from]||ethers.utils.parseEther('0')).lt(value)) return

    this.balances[from] = this.balances[from].sub(value)

    if (this.balances[to]) {
      this.balances[to] = this.balances[to].add(value)
    } else {
      this.balances[to] = value
    }

    if (caller !== from) {
      this.approve(from, caller, this.allowances[from][caller].sub(value))
    }
  }

  approve(caller, spender, value) {
    if ((this.balances[caller]||ethers.utils.parseEther('0')).lt(value)) return

    this.allowances[caller] = {
      [spender]: value
    }

  }
}

