import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from './store';
import { createProducer, leaveChannelThunk, removeVideoProducer, sendMessage, setMyAudio, setMyVideo } from './wsSlice';
import { Input, Layout } from 'antd';

const queryClient = new QueryClient();

function App() {
    const myvideo: React.RefObject<HTMLVideoElement | null> = React.createRef();

    const [channelName, setChannelName] = useState<string>('test');
    const [userId, setUserId] = useState<string>('yan');
    const state = useAppSelector((state) => state.ws);
    const dispatch = useAppDispatch();

    async function joinChannel(channelName: string) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        dispatch(setMyVideo(videoTrack));
        dispatch(setMyAudio(audioTrack));
        myvideo.current!.srcObject = new MediaStream([videoTrack]);
        dispatch(sendMessage(JSON.stringify({ type: 'joinChannel', channel: channelName, userId: userId })));
    }

    function toggleVideo() {
        if (state.producers.find((p) => p.kind == 'video')) dispatch(removeVideoProducer());
        else dispatch(createProducer({ isAudio: false }));
    }

    function leaveChannel() {
        dispatch(leaveChannelThunk());
    }

    return (
        <QueryClientProvider client={queryClient}>
            <Layout>
                <div>
                    <header>
                        <div>
                            <Input value={userId} onChange={(e) => setUserId(e.target.value)} />
                        </div>
                    </header>

                    <video
                        style={{
                            width: '360px',
                        }}
                        ref={myvideo}
                        autoPlay
                        controls
                    ></video>
                    {state.consumers.map((con) =>
                        con.kind == 'video' ? (
                            <video
                                style={{
                                    width: '360px',
                                }}
                                key={con.id}
                                ref={(vid) => {
                                    if (vid) {
                                        vid.srcObject = new MediaStream([con.track]);
                                    }
                                }}
                                controls
                                autoPlay
                            ></video>
                        ) : (
                            <audio
                                style={{ display: 'none' }}
                                key={con.id}
                                ref={(aud) => {
                                    if (aud) {
                                        aud.srcObject = new MediaStream([con.track]);
                                        aud.volume = 0.2;
                                    }
                                }}
                                autoPlay
                                controls
                            ></audio>
                        )
                    )}
                    <input value={channelName} onChange={(e) => setChannelName(e.target.value)} />
                    <button onClick={() => joinChannel(channelName)}>Присоединиться</button>
                    <button onClick={() => leaveChannel()}>Отключиться</button>
                    <button onClick={() => toggleVideo()}>Видео</button>
                </div>
            </Layout>
        </QueryClientProvider>
    );
}

export default App;
