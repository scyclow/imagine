

async function main(contractType) {
  const mintPrice = '0.001'

  // dev1, dev2, dev3
  const [dev1, dev2, dev3, _] = await ethers.getSigners();
  console.log('Dev1: ', dev1.address)



  console.log('deploying ImagineCoin')
  const ImagineCoin = await ethers.getContractFactory('ImagineCoin', dev1)
  ImagineCoinContract = await ImagineCoin.deploy()
  await ImagineCoinContract.connect(dev2).mint(100, { value: ethers.utils.parseEther(mintPrice) })






  console.log(`ImagineCoin Contract Address: ${ImagineCoinContract.address}`)

}



main(process.env.CONTRACT)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });