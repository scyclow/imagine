

async function main(contractType) {
  const mintPrice = '0.0001'

  // dev1, dev2, dev3
  const [
    treasurer,
    tokenHolder1,
    tokenHolder2,
    tokenHolder3,
    _
  ] = await ethers.getSigners();



  console.log('deploying ImagineCoin')
  const ImagineCoin = await ethers.getContractFactory('ImagineCoin', treasurer)
  ImagineCoinContract = await ImagineCoin.deploy()
  await ImagineCoinContract.connect(treasurer).mint(ethers.utils.parseEther('1000'), { value: ethers.utils.parseEther(mintPrice) })



  const tokensToMint = ethers.utils.parseEther('100')
  const txValue = ethers.utils.parseEther(String(tokensToMint * Number(mintPrice)))

  console.log((await treasurer.getBalance()).toString())
  await ImagineCoinContract.connect(tokenHolder1).mint(tokensToMint, { value: ethers.utils.parseEther(mintPrice) })
  await ImagineCoinContract.connect(tokenHolder2).mint(tokensToMint, { value: ethers.utils.parseEther(mintPrice) })

  await ImagineCoinContract.connect(tokenHolder1).burn(ethers.utils.parseEther('1'))
  await ImagineCoinContract.connect(tokenHolder1).transfer(tokenHolder2.address, ethers.utils.parseEther('10'))
  await ImagineCoinContract.connect(tokenHolder1).approve(tokenHolder2.address, ethers.utils.parseEther('1'))
  await ImagineCoinContract.connect(tokenHolder2).transferFrom(tokenHolder1.address, tokenHolder2.address, ethers.utils.parseEther('1'))




  console.log(`ImagineCoin Contract Address: ${ImagineCoinContract.address}`)

}



main(process.env.CONTRACT)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });