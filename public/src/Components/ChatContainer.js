import React, { useState, useEffect, useRef } from "react";
import ChatInput from "./ChatInput";
import Logout from "./Logout";
import { sendMessageRoute, getAllMessageRoute, deleteForMeRoute, deleteForEveryoneRoute } from '../utils/ApiRoutes';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const ChatContainer = ({ currentChat, currentUser, socket }) => {
  const scrollRef = useRef();
  const [messages, setMessages] = useState([]);
  const [arrivalMessage, setArrivalMessage] = useState(null);

  const fetchData = async () => {
    if (currentChat) {
      const response = await axios.post(getAllMessageRoute, {
        from: currentUser._id,
        to: currentChat._id,
      });
      console.log(response, 'response')
      setMessages(response.data);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentChat]);
  const handlerSendMsg = async (msg) => {
    const genereateUUid = uuidv4(); // Generate a new UUID for each message

    await axios.post(sendMessageRoute, {
      from: currentUser._id,
      to: currentChat._id,
      message: msg,
      id: genereateUUid,
    });

    socket.current.emit("send-msg", {
      to: currentChat._id,
      from: currentUser._id,
      message: msg,
      id: genereateUUid
    });

    const msgs = [...messages];
    msgs.push({ fromSelf: true, message: msg, id: genereateUUid });
    setMessages(msgs);
  };

  const handleDeleteForMe = async (uuid) => {
    await axios.delete(`${deleteForMeRoute}/${currentUser._id}/${uuid}`);
    setMessages((prevMessages) => prevMessages.filter((item) => item.id !== uuid));
    // fetchData();
  };

  const handleDeleteForEveryone = async (uuid) => {
    await axios.delete(`${deleteForEveryoneRoute}/${currentUser._id}/${uuid}/${currentChat._id}`);
    setMessages((prevMessages) => prevMessages.filter((item) => item.id !== uuid));
    // fetchData();
  };

  useEffect(() => {
    if (socket.current) {
      socket.current.on("msg-recieve", (data) => {
        setArrivalMessage({ fromSelf: false, message: data.message, id: data.id });
      });
      socket.current.on("online-receiver", (uuid) => {
        setMessages((prevMessages) => prevMessages.filter((item) => item.id !== uuid));
      });
    }
  }, []);

  useEffect(() => {
    arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  console.log(messages, 'messages')
  return (
    <div className="w-full h-full relative overflow-hidden md:w-full md:relative md:overflow-hidden lg:w-full lg:relative lg:overflow-hidden">
      {currentChat && (
        <div className="">
          <div className=" md:flex md:items-center md:justify-between md:pr-8 flex items-center justify-between pr-8 lg:flex lg:items-center lg:justify-between lg:pr-8 ">
            <div className="  user-detail py-3 px-4 flex items-center gap-4">
              <div className="avatar">
                <img
                  className="w-[50px]"
                  src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
                />
              </div>
              <div className="username">
                <h3 className="text-xl">{currentChat.username}</h3>
              </div>
            </div>
            <Logout />
          </div>
          <div className="h-[27rem] py-20 px-2 scrollbar-hide chat-messages space-y-4   overflow-scroll md:h-[27rem] md:py-20 md:px-2 md:scrollbar-hide md:chat-messages md:space-y-4   md:overflow-scroll lg:h-[27rem] lg:py-20 lg:px-2 lg:scrollbar-hide lg:chat-messages lg:space-y-4   lg:overflow-scroll">
            {messages.map((message) => {
              return (
                <div ref={scrollRef} key={uuidv4()}>
                  <div className={`message ${message.fromSelf ? 'sended flex justify-end' : 'flex recieved'}`}>
                    <div className="content bg-gray-700 rounded-lg px-2 py-2">
                      <p className="">{message.message}</p>
                      {message.fromSelf && (
                        <div className="delete-buttons flex justify-end mt-2">
                          <button onClick={() => handleDeleteForMe(message.id)} className="text-sm text-red-500 mr-2">Delete for Me</button>
                          <button onClick={() => handleDeleteForEveryone(message.id)} className="text-sm text-red-500">Delete for Everyone</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            }
            )}
          </div>
          <div>
            <ChatInput handlerSendMsg={handlerSendMsg} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
