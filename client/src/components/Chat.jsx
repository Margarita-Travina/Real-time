import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "../styles/chat.module.css";
import searchStyles from "../styles/search.module.css";
import icon from "./images/emoji.svg";
import EmojiPicker from "emoji-picker-react";
import Messages from "./Messages";

let socket;

const Chat = () => {
    const { search } = useLocation();
    const navigate = useNavigate();
    const [params, setParams] = useState({ room: "", user: "" });
    const [state, setState] = useState([]);
    const [message, setMessage] = useState("");
    const [isOpen, setOpen] = useState(false);
    const [users, setUsers] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        socket = io.connect("http://localhost:3000");
        const searchParams = Object.fromEntries(new URLSearchParams(search));
        setParams(searchParams);
        console.log("Joining with params:", searchParams);
        socket.emit("join", searchParams);

        return () => {
            socket.emit("leave");
            socket.disconnect();
        };
    }, [search]);

    useEffect(() => {
        socket.on("message", ({ data }) => {
            setState((_state) => [..._state, data]);
        });
    }, []);

    useEffect(() => {
        socket.on("room", ({ data: { users } }) => {
            setUsers(users.length);
        });

        socket.on("searchResults", ({ results }) => {
            setSearchResults(results);
        });
    }, []);

    const leftRoom = () => {
        socket.emit("leftRoom", { params });
        navigate("/");
    };


    const handleChange = (e) => {
        setMessage(e.target.value);
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message) return;

        console.log("Submitting message:", message);
        socket.emit("sendMessage", { message, params });
        setMessage("");
    };


    const toggleEmojiPicker = () => setOpen(!isOpen);


    const onEmojiClick = ({ emoji }) => setMessage(`${message} ${emoji}`);


    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        socket.emit("searchUser", { room: params.room, query: e.target.value });
    };

    return (
        <div className={styles.wrap}>
            <div className={styles.header}>
                <div className={styles.title}>{params.room}</div>
                <div className={styles.users}>
                    {users} user{users !== 1 && "s"} in this room
                </div>
                <button className={styles.left} onClick={leftRoom}>
                    Leave the room
                </button>
            </div>


            <div className={searchStyles.search}>
                <input
                    type="text"
                    placeholder="Search users"
                    value={searchQuery}
                    onChange={handleSearch}
                />
            </div>


            <div className={searchStyles.searchResults}>
                {searchResults.length > 0 ? (
                    searchResults.map((user, index) => (
                        <div key={index} className={searchStyles.user}>
                            {user.name}
                        </div>
                    ))
                ) : (
                    <div>No users found</div>
                )}
            </div>

            <div className={styles.messages}>
                <Messages messages={state} name={params.name} />
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.input}>
                    <input className={styles.text}
                        type="text"
                        name="message"
                        value={message}
                        placeholder="What do you want to say"
                        onChange={handleChange}
                        autoComplete="off"
                        required
                    />
                </div>
                <button type="submit" className={styles.button}>
                    Send
                </button>

                <div className={styles.emoji}>
                    <img
                        src={icon}
                        alt="emoji picker icon"
                        onClick={toggleEmojiPicker}
                    />
                    {isOpen && (
                        <div className={styles.emojies}>
                            <EmojiPicker onEmojiClick={onEmojiClick} />
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default Chat;
