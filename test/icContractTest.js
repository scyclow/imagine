
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
      ...signers
    ] = await ethers.getSigners()


    const ImagineCoin = await ethers.getContractFactory('ImagineCoin', treasurer)
    const ImagineCoinContract = await ImagineCoin.deploy()

    await ImagineCoinContract.deployed()

    const mintPrice = '0.0001'
    const tokensToMint = ethers.utils.parseEther('100')
    consttxValue = ethers.utils.parseEther(String(tokensToMint * Number(mintPrice)))

    await ImagineCoinContract.connect(tokenHolder1).mint(tokensToMint, { value: ethers.utils.parseEther(mintPrice) })



  })
})

