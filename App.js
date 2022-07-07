import React, {Component} from 'react';
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSet,
  AudioSourceAndroidType,
} from 'react-native-audio-recorder-player';
import SpeechAndroid from 'react-native-android-voice';
import {
  Dimensions,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ToastAndroid
} from 'react-native';
import {Card, Title, Button, Divider} from 'react-native-paper'
export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoggingIn: false,
      recordSecs: 0,
      recordTime: '00:00:00',
      currentPositionSec: 0,
      currentDurationSec: 0,
      playTime: '00:00:00',
      duration: '00:00:00',
      uri:''
    };
    this.audioRecorderPlayer = new AudioRecorderPlayer();
    this.audioRecorderPlayer.setSubscriptionDuration(0.09); // optional. Default is 0.1
    
    
  }
  onStartPlay = async (e) => {
    console.log('onStartPlay');
    const msg = await this.audioRecorderPlayer.startPlayer(this.state.uri);
    this.audioRecorderPlayer.setVolume(1.0);
    console.log(msg);
    this.audioRecorderPlayer.addPlayBackListener((e) => {
      if (e.current_position === e.duration) {
        console.log('finished');
        this.audioRecorderPlayer.stopPlayer();
      }
      this.setState({
        currentPositionSec: e.current_position,
        currentDurationSec: e.duration,
        playTime: this.audioRecorderPlayer.mmssss(
          Math.floor(e.current_position),
        ),
        duration: this.audioRecorderPlayer.mmssss(Math.floor(e.duration)),
      });
    });
  };
  onStopPlay = async (e) => {
    console.log('onStopPlay');
    this.audioRecorderPlayer.stopPlayer();
    this.audioRecorderPlayer.removePlayBackListener();
  };
  onPausePlay = async (e) => { 
    await this.audioRecorderPlayer.pausePlayer();
 };
  onStopRecord = async () => {
    const result = await this.audioRecorderPlayer.stopRecorder();
    this.audioRecorderPlayer.removeRecordBackListener();
    this.setState({
      recordSecs: 0,
    });
    console.log(result);
  };
  onStartRecord = async () => {
    
    if(Platform.OS === 'android'){
      try{
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        ])
        console.log("write external storage",grants);

        if (
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.RECORD_AUDIO'] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('permissions granted');
        } else {
          console.log('All required permissions not granted');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
      }
      const audioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: AVEncodingOption.aac,
      };
      console.log('audioset', audioSet);
      const uri = await this.audioRecorderPlayer.startRecorder(
        undefined,
        audioSet
      )
      this.audioRecorderPlayer.addRecordBackListener((e) => {
        // console.log('record-back', e);
        this.setState({
          recordSecs: e.currentPosition,
          recordTime: this.audioRecorderPlayer.mmssss(
            Math.floor(e.currentPosition),
          ),
        });
      });
      try{
        //More Locales will be available upon release.
        var spokenText = await SpeechAndroid.startSpeech("Speak yo", SpeechAndroid.ENGLISH);
        ToastAndroid.show(spokenText , ToastAndroid.LONG);
    }catch(error){
        switch(error){
            case SpeechAndroid.E_VOICE_CANCELLED:
                ToastAndroid.show("Voice Recognizer cancelled" , ToastAndroid.LONG);
                break;
            case SpeechAndroid.E_NO_MATCH:
                ToastAndroid.show("No match for what you said" , ToastAndroid.LONG);
                break;
            case SpeechAndroid.E_SERVER_ERROR:
                ToastAndroid.show("Google Server Error" , ToastAndroid.LONG);
                break;
            /*And more errors that will be documented on Docs upon release*/
        }
    }
      this.setState({
        uri: uri
      })
      console.log(`uri: ${uri}`);

  
  };
  render(){
    return(
      <Card style = {{ flex: 1, flexDirection: 'row', alignItems: 'center', alignContent: 'center', alignSelf: 'center' }}>
      <Title>{this.state.recordTime}</Title>
      <Button mode="contained" icon="record" onPress={() => this.onStartRecord()}>
        RECORD
      </Button>
  
      <Button
        icon="stop"
        mode="outlined"
        onPress={() => this.onStopRecord()}
      >
        STOP
      </Button>
      <Divider />
      <Title>{this.state.playTime} / {this.state.duration}</Title>
      <Button mode="contained" icon="play" onPress={() => this.onStartPlay()}>
        PLAY
      </Button>
  
      <Button
        icon="pause"
        mode="contained"
        onPress={() => this.onPausePlay()}
      >
        PAUSE
      </Button>
      <Button
        icon="stop"
        mode="outlined"
        onPress={() => this.onStopPlay()}
      >
        STOP
      </Button>
      </Card >
    )
  }
  

  
}