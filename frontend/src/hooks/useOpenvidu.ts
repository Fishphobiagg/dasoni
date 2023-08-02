import axios from 'axios';
import { Device, OpenVidu } from 'openvidu-browser';
import { useCallback, useEffect, useMemo, useState } from 'react';

// 서버 주소를 환경에 따라 설정
const APPLICATION_SERVER_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4443';
const OPENVIDU_SERVER_SECRET = 'MY_SECRET';

export const useOpenvidu = (memberId: number, meetingRoomId: string) => {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [publisher, setPublisher] = useState<any>();
  const [session, setSession] = useState<any>();

  const leaveSession = useCallback(() => {
    if (session) session.disconnect();

    setSession(null);
    setPublisher(null);
    setSubscribers([]);
  }, [session]);

  // 세션에 연결 후 비디오 생성하고 발행하는 처리
  useEffect(() => {
    const openVidu = new OpenVidu();
    const session = openVidu.initSession();
    console.log('session 초기화');

    // 스트림 생성 이벤트 구독
    // 스트림 생성 시 subscriber 세팅
    session.on('streamCreated', (event) => {
      console.log(event);
      const subscriber = session.subscribe(event.stream, undefined);
      setSubscribers((subscribers) => [...subscribers, subscriber]);
    });

    // 스트림 삭제 이벤트 구독
    // 스트림 삭제시 subscriber 삭제 >> 세션 참여자가 세션에 미디어 게시 멈출 때 발생
    session.on('streamDestroyed', (event) => {
      deleteSubscriber(event.stream.streamManager);
    });

    // 에러 발생시 이벤트 발생
    session.on('exception', (exception) => {
      console.warn(exception);
    });

    // OpenVidu 배포에서 토큰 얻기
    if (session) {
      getToken(meetingRoomId).then(async (token) => {
        try {
          console.log(token);
          // 획득한 토큰으로 세션에 연결
          await session.connect(token, JSON.stringify({ memberId }));
          // await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          const devices: Device[] = await openVidu.getDevices(); // 사용 가능한 미디어 입력 장치 대한 정보 가져오기
          const videoDevices = devices.filter((device) => device.kind === 'videoinput'); // device.kind : device 종류 videoinput | audioinput

          // 새로운 publisher 리턴
          const publisher = openVidu.initPublisher('', {
            audioSource: undefined, // 소리 장치를 어떤 장치로 할지 설정 >> default :: 기본 마이크
            videoSource: videoDevices[0].deviceId,
            publishAudio: true, // 세션에 처음 게시할 때 오디오 음소거 / 음소거 해제 설정
            publishVideo: true, // 세션에 처음 게시할 때 비디오 켜기 / 끄기 설정
            resolution: '640x480', // 비디오 해상도 :: "320x240(low)", "640x480(medium)", "1280x720(high)"
            frameRate: 30, // 초당 프레임 수 설정
            insertMode: 'APPEND', // DOM에 publisher video element 삽입하는 방법
            mirror: true, // 거울모드 설정
          });

          console.log('publisher ' + publisher);
          setPublisher(publisher);
          session.publish(publisher); // 세션에 publisher 객체 게시, 세션의 streamCreated 이벤트 발생
        } catch (err: any) {
          console.log('There was an error connecting to the session:', err.code, err.message);
        }
      });
    }

    setSession(session);
    return () => {
      if (session) session.disconnect();
      setSession(null);
      setPublisher(null);
      setSubscribers([]);
    };
  }, []);

  // subscriber 삭제
  const deleteSubscriber = useCallback((streamManager: any) => {
    setSubscribers((prevSubscribers) => {
      const index = prevSubscribers.indexOf(streamManager);
      if (index > -1) {
        const newSubscribers = [...prevSubscribers];
        newSubscribers.splice(index, 1);
        return newSubscribers;
      } else {
        return prevSubscribers;
      }
    });
  }, []);

  useEffect(() => {
    window.addEventListener('beforeunload', () => leaveSession());

    return () => {
      window.removeEventListener('beforeunload', () => leaveSession());
    };
  }, [leaveSession]);

  const onChangeCameraStatus = useCallback(
    (status: boolean) => {
      publisher?.publishVideo(status);
    },
    [publisher],
  );

  const onChangeMicStatus = useCallback(
    (status: boolean) => {
      publisher?.publishAudio(status);
    },
    [publisher],
  );

  const streamList = useMemo(
    () => [{ streamManager: publisher, memberId }, ...subscribers],
    [publisher, subscribers, memberId],
  );

  return {
    publisher,
    streamList,
    onChangeCameraStatus,
    onChangeMicStatus,
  };
};

// 세션 연결을 위해 토큰 가져오는 함수
const getToken = async (roomId: string) => {
  return createSession(roomId).then((roomId) => createToken(roomId));
};

// 세션 생성
const createSession = async (roomId: string) => {
  try {
    const res = await axios.post(
      `${APPLICATION_SERVER_URL}/openvidu/api/sessions`,
      { customSessionId: roomId },
      {
        headers: {
          Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
          'Content-Type': 'application/json',
        },
      },
    );

    if (res.status == 200) {
      console.log('세션 생성', res);
      console.log(res.data.sessionId);
      return res.data.sessionId; // sessionId 반환
    }
  } catch (err) {
    console.error(err);
  }
};

// 토큰 생성
const createToken = async (sessionId: string) => {
  try {
    console.log('sessionId ' + sessionId);
    const res = await axios.post(
      `${APPLICATION_SERVER_URL}/openvidu/api/sessions/${sessionId}/connection`,
      {},
      {
        headers: {
          Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
          'Content-Type': 'application/json',
        },
      },
    );

    if (res.status == 200) {
      console.log(res);
      return res.data.token; // 토큰 반환
    }
  } catch (err) {
    console.error(err);
  }
};
