import React, { useState } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import { create as ipfsHttpClient } from "ipfs-http-client";

//INTERNAL IMPORT
import { toDolistAddress, toDolistAddressABI } from "./constants";
const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

const fetchContract = (signerOrProvider) =>
  new ethers.Contract(toDolistAddress, toDolistAddressABI, signerOrProvider);

export const ToDoListContext = React.createContext();

export const VotingProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [error, setError] = useState("");
  const [allToDoList, setAllToDoList] = useState([]);
  const [myList, setmyList] = useState([]);

  const [allAddress, setAllAddress] = useState([]);
  //----CONNECTING METAMASK

  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) return setError("Please Install MetaMask");

    const account = await window.ethereum.request({ method: "eth_accounts" });

    if (account.length) {
      setCurrentAccount(account[0]);
    } else {
      setError("Please Install MetaMask & Connect, Reload");
    }
  };

  //-----CONNECT WALLET
  const connectWallet = async () => {
    if (!window.ethereum) return setError("Please Install MetaMask");

    const account = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setCurrentAccount(account[0]);
  };

  //----UPLOAD TO IPFS VOTER IMAGE
  const uploadToIPFS = async (file) => {
    try {
      const added = await client.add({ content: file });

      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      return url;
    } catch (error) {
      setError("Error Uploading file to IPFS");
    }
  };

  const toDoList = async (message) => {
    try {
      //CONNECTING SMART CONTRACT
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contract = await fetchContract(signer);

      const data = JSON.stringify({ message });
      const added = await client.add(data);

      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      console.log(url);

      const createList = await contract.createList(message);
      createList.wait();
      consolelog(createList);
    } catch (error) {
      setError("something wrong creating list");
    }
  };

  const getToDoList = async () => {
    try {
      //CONNECTING SMART CONTRACT
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contract = await fetchContract(signer);

      //GET DATA
      const getAllAddress = await contract.getAddress();
      setAllAddress(getAllAddress);
      console.log(getAllAddress);

      getAllAddress.map(async (el) => {
        const getSingleData = await contract.getCreatorData(el);
        allToDoList.push(getSingleData);
        console.log(getSingleData);
      });

      const allMessage = await contract.getMessage();
      setmyList(allMessage);
    } catch (error) {
      setError("Something wrong while getting the data");
    }
  };

  const change = async (address) => {
    try {
      //CONNECTING SMART CONTRACT
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contract = await fetchContract(signer);

      const state = await contract.toggle(address);
      state.wait();
      console.log(state);
    } catch (error) {
      console.log("Wrong");
    }
  };

  return (
    <ToDoListContext.Provider
      value={{
        checkIfWalletIsConnected,
        connectWallet,
        uploadToIPFS,
        toDoList,
        allToDoList,
        currentAccount,
        getToDoList,
        error,
        allAddress,
        myList,
        change,
      }}
    >
      {children}
    </ToDoListContext.Provider>
  );
};
