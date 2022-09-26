// NftUploader.jsx
import { ethers } from "ethers";
import { Button } from "@mui/material";
import React from "react";
import { useEffect, useState } from "react";
import ImageLogo from "./image.svg";
import "./NftUploader.css";
import Web3Mint from "../../utils/Web3Mint.json";
import { Web3Storage } from "web3.storage";

const NftUploader = () => {
  /*
   * ユーザーのウォレットアドレスを格納するために使用する状態変数を定義します。
   */
  const [currentAccount, setCurrentAccount] = useState("");
  // ミント回数を格納するための状態変数を定義します。
  const [mintCount, setMintCount] = useState(0);
  const [totalMintCount, setTotalMintCount] = useState(0);
  // ローディング中のアニメーションを作成します。
  const [loading, setLoading] = useState(true);
  // 適切なネットワークにいるか確認します。
  const [isNetworkOk, setIsNetworkOk] = useState(false);
  //  Mintしたところに遷移する。
  const [mintUrl, setMintUrl] = useState("");

  const CONTRACT_ADDRESS = "0xB6DC5a862AB5CAA90dAd41cDffc750Bd2A56D73a";

  /*この段階でcurrentAccountの中身は空*/
  console.log("currentAccount: ", currentAccount);
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);

      // Goerliを利用しているか確認します。:
      let chainId = await ethereum.request({ method: "eth_chainId" });
      console.log("Connected to chain " + chainId);
      // 0x5 は　Goerli の ID です。
      const goerliChainId = "0x5";
      if (chainId !== goerliChainId) {
        setIsNetworkOk(false);
      }
      if (chainId === goerliChainId) {
        setIsNetworkOk(true);
      }
    } else {
      console.log("No authorized account found");
    }
  };
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      /*
       * ウォレットアドレスに対してアクセスをリクエストしています。
       */
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      /*
       * ウォレットアドレスを currentAccount に紐付けます。
       */
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async (ipfs) => {
    try {
      setLoading(true);
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          Web3Mint.abi,
          signer
        );
        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await connectedContract.mintIpfsNFT("sample", ipfs);
        console.log("Mining...please wait.");
        await nftTxn.wait();
        console.log(
          `Mined, see transaction: https://goerli.etherscan.io/tx/${nftTxn.hash}`
        );
        let number = await connectedContract.TotalMintCount();
        setMintUrl(
          `https://testnets.opensea.io/assets/goerli/${CONTRACT_ADDRESS}/${
            number.toNumber() - 1
          }`
        );
        setLoading(false);
      } else {
        setLoading(false);
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  const imageToNFT = async (e) => {
    const API_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDY5ZDhBMjJGM2QzMjVhNzJjZUUzM2ZEZDg1YzAyZDU4QjkzMDc3MTkiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NjM5NDI3MDk4NzksIm5hbWUiOiJORlRfTWFrZXIifQ.EyDtN1V2Tj_joUBZnhH_wWdKgC44zv6WlbMGlrBuV8Q";
    const client = new Web3Storage({ token: API_KEY });
    const image = e.target;
    console.log(image);

    const rootCid = await client.put(image.files, {
      name: "experiment",
      maxRetries: 3,
    });
    const res = await client.get(rootCid); // Web3Response
    const files = await res.files(); // Web3File[]
    for (const file of files) {
      console.log("file.cid:", file.cid);
      askContractToMintNft(file.cid);
    }
  };

  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Connect to Wallet
    </button>
  );

  // Mintの数を取得します。
  const getMintCount = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          Web3Mint.abi,
          signer
        );
        let number = await connectedContract.TotalMintCount();
        let maxNumber = await connectedContract.MaxMintCount();
        if (!number) return;
        setMintCount(number.toNumber());
        setTotalMintCount(maxNumber.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  /*
   * ページがロードされたときに useEffect()内の関数が呼び出されます。
   */
  useEffect(() => {
    setLoading(true);
    checkIfWalletIsConnected();
    getMintCount();
    setLoading(false);
  }, []);

  return (
    <div className="outerBox">
      {currentAccount === "" ? (
        renderNotConnectedContainer()
      ) : (
        <p>If you choose image, you can mint your NFT</p>
      )}
      {/* ネットワークが適切かAlertします。 */}
      {!isNetworkOk ? (
        <p className=" animate-pulse  text-orange-500">
          You are not in Goerli Network...
        </p>
      ) : (
        <p className=" text-green-500">You are in Goerli Network!</p>
      )}
      <div className="title">
        <h2>NFTアップローダー</h2>
        <p>JpegかPngの画像ファイル</p>
      </div>
      <div className="nftUplodeBox">
        <div className="imageLogoAndText">
          <img className="mx-auto" src={ImageLogo} alt="imagelogo" />
          <p>ここにドラッグ＆ドロップしてね</p>
        </div>
        <input
          className="nftUploadInput"
          multiple
          name="imageURL"
          type="file"
          accept=".jpg , .jpeg , .png"
          onChange={imageToNFT}
        />
      </div>
      <p>または</p>
      <Button variant="contained">
        ファイルを選択
        <input
          className="nftUploadInput"
          type="file"
          accept=".jpg , .jpeg , .png"
          onChange={imageToNFT}
        />
      </Button>
      {/* ローディング中か表示します。 */}
      {loading && (
        <p className="mt-3 animate-pulse  text-orange-500">Loading...</p>
      )} 
       {/* Mintされた回数を表示します。   */}
      {{mintCount}!=={totalMintCount}? (
        <p className="mt-3  text-green-500">
          これまでに作成されたNFTの数 {mintCount}/{totalMintCount} NFT
        </p>
      ) : (
        <p className="mt-3 animate-pulse text-red-500">
          上限に達したためMintできません {mintCount}/{totalMintCount}
        </p>
      )}
      {mintUrl !== "" && (
        <a href={mintUrl} target="_blank">
          <p className="animate-pulse font-semibold border p-1 border-gray-500">Click here to see your NFT</p>
        </a>
      )}
    </div>
  );
};

export default NftUploader;
