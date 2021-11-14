
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

describe('NegativeValueCertificates', () => {
  it('should work', async () => {
    const [
      _, __,
      devWallet,
      owner,
      certHolder1,
      certHolder2,
      certHolder3,
      ...signers
    ] = await ethers.getSigners()


    const NegativeValueCert = await ethers.getContractFactory('NegativeValueCertificates', devWallet)
    const NegativeValueCertContract = await NegativeValueCert.deploy(owner.address)

    await NegativeValueCertContract.deployed()

    await NegativeValueCertContract.connect(owner).safeMint(owner.address)
    await NegativeValueCertContract.connect(owner).safeMint(certHolder1.address)
    await NegativeValueCertContract.connect(owner).safeMint(certHolder2.address)
    await NegativeValueCertContract.connect(owner).safeMint(certHolder3.address)

    console.log(await NegativeValueCertContract.connect(owner).ownerOf(1))
    console.log(await NegativeValueCertContract.connect(owner).ownerOf(2))
    console.log(await NegativeValueCertContract.connect(owner).ownerOf(3))
    console.log(await NegativeValueCertContract.connect(owner).ownerOf(4))


    const metadata0 = await NegativeValueCertContract.connect(owner).tokenURI(1)
    console.log(Buffer.from(metadata0.split(',')[1], 'base64').toString('utf-8'))

    await NegativeValueCertContract.connect(owner).flipUseURIPointer()

    await NegativeValueCertContract.connect(owner).updateBaseUrl('www.bing.com/', '.html')
    const metadata1 = await NegativeValueCertContract.connect(owner).tokenURI(1)
    console.log(metadata1)

    await NegativeValueCertContract.connect(owner).flipUseURIPointer()

    const metadata2 = await NegativeValueCertContract.connect(owner).tokenURI(1)
    console.log(Buffer.from(metadata2.split(',')[1], 'base64').toString('utf-8'))

    await NegativeValueCertContract.connect(owner).updateMetadataParams(
      'Edition',
      ' out of 256',
      'prettyPictures/',
      '.jpg',
      'www.google.com/tokenPage/',
      'MIT'
    )
    await NegativeValueCertContract.connect(owner).updateProjectDescription('new description')


    const metadata3 = await NegativeValueCertContract.connect(owner).tokenURI(1)
    console.log(Buffer.from(metadata3.split(',')[1], 'base64').toString('utf-8'))


    await NegativeValueCertContract.connect(owner).emitProjectEvent('projectGreeting', 'Hello project')
    await NegativeValueCertContract.connect(owner).emitTokenEvent(1, 'tokenGreeting', 'Hello token 1')
    await NegativeValueCertContract.connect(certHolder1).emitTokenEvent(2, 'tokenGreeting', 'Hello token 2 holder')

    await expectFailure(() => NegativeValueCertContract.connect(certHolder2).safeMint(certHolder2.address), 'Caller is not the minting address')
    await expectFailure(() => NegativeValueCertContract.connect(certHolder2).flipUseURIPointer(), 'Ownable:')
    await expectFailure(() => NegativeValueCertContract.connect(certHolder2).updateBaseUrl('www.wrong.com', '.wrong'), 'Ownable:')
    await expectFailure(() => NegativeValueCertContract.connect(certHolder2).emitProjectEvent('projectGreeting', 'wrong project event'), 'Ownable:')
    await expectFailure(() => NegativeValueCertContract.connect(certHolder2).emitTokenEvent(1, 'tokenGreeting', 'wrong token event'), 'Only project or token owner can emit token event')
    await expectFailure(() => NegativeValueCertContract.connect(certHolder2).updateProjectDescription('wong description'), 'Ownable:')
    await expectFailure(() => NegativeValueCertContract.connect(certHolder2).updateMetadataParams(
      '@',
      ' of 257',
      'wrongPictures/',
      '.wrong',
      'www.wrong.com/wrongPage/',
      'ISC'
    ), 'Ownable:')

  })

  describe('minter integration', () => {
    const mintPrice = '0.0993774'
    const mintPriceTooLow = '0.0993773'

    let devWallet, owner, iouHolder, notIouHolder
    let IOUContract, NegativeValueCertContract, NegativeValueCertMinterContract

    before(async () => {
      [
        _, __,
        devWallet,
        owner,
        iouHolder,
        notIouHolder,
        ...signers
      ] = await ethers.getSigners()

      const IOU = await ethers.getContractFactory('IOU', devWallet)
      IOUContract = await IOU.deploy()
      await IOUContract.connect(devWallet).transferOwnership(owner.address)
      await IOUContract.connect(owner).batchSafeMint([
        owner.address,
        iouHolder.address,
        iouHolder.address,
      ])

      // Setup NVC contracts
      const NegativeValueCert = await ethers.getContractFactory('NegativeValueCertificates', devWallet)
      NegativeValueCertContract = await NegativeValueCert.deploy(owner.address)

      const NegativeValueCertMinter = await ethers.getContractFactory('NegativeValueCertificatesMinter', devWallet)
      NegativeValueCertMinterContract = await NegativeValueCertMinter.deploy(
        NegativeValueCertContract.address,
        IOUContract.address,
        owner.address
      )

      await NegativeValueCertContract.deployed()

      const totalSupply = await NegativeValueCertContract.connect(owner).totalSupply()
      expect(totalSupply).to.equal(0)

    })

    it('should succeed with mint #1', async () => {
      await NegativeValueCertContract.connect(owner).safeMint(owner.address)
    })


    it('should only let the owner do owner things', async () => {
      await expectFailure(() => NegativeValueCertMinterContract.connect(iouHolder).flipIsLocked(), 'Only owner')
      await expectFailure(() => NegativeValueCertMinterContract.connect(iouHolder).flipIsPremint(), 'Only owner')
      await expectFailure(() => NegativeValueCertMinterContract.connect(iouHolder).transferOwnership(notIouHolder.address), 'Only owner')
      await expectFailure(() => NegativeValueCertMinterContract.connect(iouHolder).updatePrice(ethers.utils.parseEther(mintPriceTooLow)), 'Only owner')
    })

    it('should not let minting through the mint contract work yet', async () => {
      await expectFailure(() =>
        NegativeValueCertMinterContract
          .connect(iouHolder)
          .mintWithIOU(1, { value: ethers.utils.parseEther(mintPrice) })
      , 'Caller is not the minting address')
    })

    it('should assign the minter', async () => {
      await NegativeValueCertContract.connect(owner).setMintingAddress(NegativeValueCertMinterContract.address)
    })

    it('should fail if payment is too low', async () => {
      await expectFailure(() =>
        NegativeValueCertMinterContract
          .connect(iouHolder)
          .mintWithIOU(1, { value: ethers.utils.parseEther(mintPriceTooLow) })
      , 'Insufficient payment')
    })

    it('should not allow minting when locked in premint', async () => {
      await NegativeValueCertMinterContract.connect(owner).flipIsLocked()

      await expectFailure(async () =>
        await NegativeValueCertMinterContract
          .connect(iouHolder)
          .mintWithIOU(1, { value: ethers.utils.parseEther(mintPrice) })
      , 'Minting contract is locked')

      await NegativeValueCertMinterContract.connect(owner).flipIsLocked()
    })

    it('should let an IOU holder mint succeed', async () => {
      await NegativeValueCertMinterContract
        .connect(iouHolder)
        .mintWithIOU(1, { value: ethers.utils.parseEther(mintPrice) })
    })

    it('should not let IOU mint twice', async () => {
      await expectFailure(() =>
        NegativeValueCertMinterContract
          .connect(iouHolder)
          .mintWithIOU(1, { value: ethers.utils.parseEther(mintPrice) })
      , 'This IOU has already been used')
    })

    it('should not let non-IOU holders mint', async () => {
      await expectFailure(() =>
        NegativeValueCertMinterContract
          .connect(notIouHolder)
          .mintWithIOU(2, { value: ethers.utils.parseEther(mintPrice) })
      , 'You are not the owner of this IOU')

      await expectFailure(() =>
        NegativeValueCertMinterContract
          .connect(notIouHolder)
          .mint({ value: ethers.utils.parseEther(mintPrice) })
      , 'You are not the owner of this IOU')
    })

    it('should allow a second NVC to be minted', async () => {
      await NegativeValueCertMinterContract
          .connect(iouHolder)
          .mintWithIOU(2, { value: ethers.utils.parseEther(mintPrice) })
    })

    it('should not allow minting from the NVC contract directly', async () => {
      await expectFailure(() =>
        NegativeValueCertContract
          .connect(iouHolder)
          .safeMint(iouHolder.address)
      , 'Caller is not the minting address')
    })

    it('should turn off the pre minter', async () => {
      await NegativeValueCertMinterContract.connect(owner).flipIsPremint()
    })

    it('should fail when payment is too low', async () => {
      await expectFailure(() =>
        NegativeValueCertMinterContract
          .connect(notIouHolder)
          .mint({ value: ethers.utils.parseEther(mintPriceTooLow) })
      , 'Insufficient payment')
    })

    it('should not allow minting when locked', async () => {
      await NegativeValueCertMinterContract.connect(owner).flipIsLocked()

      await expectFailure(() =>
        NegativeValueCertMinterContract
          .connect(notIouHolder)
          .mint({ value: ethers.utils.parseEther(mintPrice) })
      , 'Minting contract is locked')

      await NegativeValueCertMinterContract.connect(owner).flipIsLocked()
    })

    it('should allow a standard mint', async () => {
      await NegativeValueCertMinterContract
        .connect(notIouHolder)
        .mint({ value: ethers.utils.parseEther(mintPrice) })
    })

    it('should allow 256 mints', async () => {
      for (let m = 5; m <= 256; m++) {
        await NegativeValueCertMinterContract
          .connect(notIouHolder)
          .mint({ value: ethers.utils.parseEther(mintPrice) })
      }
    })

    it('should not allow a 257th mint', async () => {
      await expectFailure(() =>
        NegativeValueCertMinterContract
          .connect(notIouHolder)
          .mint({ value: ethers.utils.parseEther(mintPrice) })
      , 'Can only mint up to 256 tokens.')
    })

    it('should all be correct', async () => {
      const ownerBalance = await NegativeValueCertContract.connect(owner).balanceOf(owner.address)
      const iouHolderBalance = await NegativeValueCertContract.connect(owner).balanceOf(iouHolder.address)
      const notIouHolderBalance = await NegativeValueCertContract.connect(owner).balanceOf(notIouHolder.address)
      const totalSupply = await NegativeValueCertContract.connect(owner).totalSupply()

      expect(ownerBalance).to.equal(1)
      expect(iouHolderBalance).to.equal(2)
      expect(notIouHolderBalance).to.equal(253)
      expect(totalSupply).to.equal(256)

      expect(await NegativeValueCertContract.connect(notIouHolder).ownerOf(10)).to.equal(notIouHolder.address)

      await NegativeValueCertContract.connect(notIouHolder).transferFrom(notIouHolder.address, iouHolder.address, 10)
      expect(await NegativeValueCertContract.connect(notIouHolder).ownerOf(10)).to.equal(iouHolder.address)
    })

  })
})

