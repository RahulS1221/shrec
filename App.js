import React, { Component } from 'react';
import Voice from '@react-native-voice/voice';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {
  Dimensions,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Touchable,
  TouchableOpacity,
  View,
} from 'react-native';
import AudioRecord from 'react-native-audio-record';
import BackgroundTimer from 'react-native-background-timer';
import Icon from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';
import axios from 'axios';
import { Switch } from 'react-native-switch';
import { ActivityIndicator } from 'react-native-paper';
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
      uri: '',
      recognized: '',
      started: '',
      results: [],
      isRecording: false,
      paused: false,
      original: true,
      data: null,
      play: false,
      load: false
    };
    const options = {
      sampleRate: 16000,  // default 44100
      channels: 1,        // 1 or 2, default 1
      bitsPerSample: 16,  // 8 or 16, default 16
      audioSource: 6,     // android only (see below)
      wavFile: 'test.wav' // default 'audio.wav'
    };

    AudioRecord.init(options);
    this.audioRecorderPlayer = new AudioRecorderPlayer();

    Voice.onSpeechStart = this.onSpeechStart.bind(this)
    Voice.onSpeechRecognized = this.onSpeechRecognized.bind(this)
    Voice.onSpeechResults = this.onSpeechResults.bind(this)
    Voice.onSpeechError = this.onSpeechError.bind(this);


  }
  componentWillUnmount() {
    Voice.destroy().then(Voice.removeAllListeners);
  }
  onSpeechError = (event) => {
    console.log('_onSpeechError');
    console.log(event.error);
  };
  onSpeechStart(e) {
    this.setState({
      started: '√',
    });
    console.log("Speech started")
  }
  onSpeechRecognized(e) {
    this.setState({
      recognized: '√',
    });
    console.log("Speech recognized")
  }
  onSpeechResults(e) {
    this.setState({
      results: e.value,
    });
    console.log(e.value)
  }
  onStartPlay = async (e) => {
    console.log('onStartPlay');
    this.setState({ play: true })
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
    this.setState({ play: false })
  };
  onPausePlay = async (e) => {

    await this.audioRecorderPlayer.pausePlayer();
    this.setState({ play: false })
  };

  onStopRecord = async () => {

    try {
      await Voice.stop();
      console.log("Stop recognition")
    } catch (e) {
      //eslint-disable-next-line
      console.error(e);
    }

    let audioFile = await AudioRecord.stop();
    this.setState({ uri: audioFile, load: true })
    BackgroundTimer.stopBackgroundTimer();
    console.log(audioFile)

    RNFS.readFile(audioFile, 'base64')
      .then(res => {

        axios.post('http://192.168.198.66:5000/helloworld/tim', { name: JSON.stringify(res) })
          .then((res) => { this.setState({ data: res.data, load: false }) })
          .catch((err) => console.log(err))
      });



    this.setState({
      recordSecs: 0,
      recordTime: '00:00:00',
      isRecording: false
    });
  };
  onStartRecord = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        ])
        console.log("write external storage", grants);

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

    AudioRecord.start();
    BackgroundTimer.runBackgroundTimer(() => {
      this.setState({ recordSecs: this.state.recordSecs + 1 })
    },
      1000);
    this.setState({
      isRecording: true
    })

  };

  convertToTime = (duration) => {
    // Hours, minutes and seconds
    var hrs = ~~(duration / 3600);
    var mins = ~~((duration % 3600) / 60);
    var secs = ~~duration % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";

    ret += "0" + hrs + ":" + (mins < 10 ? "0" : "");

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
  }
  render() {
    if (this.state.load) {
      return(
        <View style={{ flex: 1, display: 'flex', backgroundColor: '#121212', flexDirection: 'column', width: Dimensions.get('window').width, alignItems: 'center', alignContent: 'center', alignSelf: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size={"large"} color="orange" />
        <Text style={{fontSize: 30, color: '#fff', marginTop: 30}}>Processing ...</Text>
      </View>
      )
      
    }
    else {
      if (!this.state.data)
        return (
          <View style={{ flex: 1, display: 'flex', backgroundColor: '#121212', flexDirection: 'column', width: Dimensions.get('window').width, alignItems: 'center', alignContent: 'center', alignSelf: 'center', justifyContent: 'space-evenly' }}>
            <View style={{ height: 60 }}></View>
            <View>
              <Text style={{ fontSize: 42, color: '#ffffff' }}>{this.convertToTime(this.state.recordSecs)}</Text>
            </View>
            {!this.state.isRecording ? <TouchableOpacity mode="contained" style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onPress={() => this.onStartRecord()}>
              <View style={{ backgroundColor: 'red', height: 60, width: 60, borderRadius: 30 }}></View>
            </TouchableOpacity> :
              <View style={{ display: 'flex', height: 80, width: Dimensions.get('window').width, flexDirection: 'row', alignContent: 'space-between', justifyContent: 'center', alignItems: 'center' }}>

                <TouchableOpacity mode="contained" style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onPress={() => this.onStopRecord()}>
                  <Icon name='stop' size={36} color='#000000' />
                </TouchableOpacity>
              </View>}

            {/* <Button
          icon="stop"
          mode="outlined"
          onPress={() => this.onStopRecord()}
        >
          STOP
        </Button> */}
            {/* <Divider />
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
        </Button> */}
          </View >
        )
      else {
        return (
          <View style={{ flex: 1, display: 'flex', backgroundColor: '#121212', flexDirection: 'column', width: Dimensions.get('window').width, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => { this.setState({ data: null }) }} style={{ position: 'absolute', top: 20, right: 20 }}>
              <Icon name="close" size={40} color="#fff"></Icon>
            </TouchableOpacity>
            <View style={{ marginTop: 60, display: 'flex', flexDirection: 'row', borderColor: '#fff', borderWidth: 1, width: Dimensions.get('window').width / 2, height: 40, alignItems: 'center', justifyContent: 'space-around', borderRadius: 8 }}>
              <TouchableOpacity style={this.state.original ? { backgroundColor: 'orange', paddingLeft: 8, paddingRight: 8, borderRadius: 6, paddingVertical: 4 } : null} onPress={() => { this.setState({ original: true }) }}>
                <Text style={{ color: '#fff' }}>Original</Text>
              </TouchableOpacity>
              <TouchableOpacity style={!this.state.original ? { backgroundColor: 'orange', paddingLeft: 8, paddingRight: 8, borderRadius: 6, paddingVertical: 4 } : null} onPress={() => { this.setState({ original: false }) }}>
                <Text style={{ color: '#fff' }}>Summarized</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ width: Dimensions.get('window').width - 40, height: Dimensions.get('window').height / 2, marginTop: 40, marginBottom: 80 }}>
              {this.state.original ? <Text style={{ fontSize: 18, color: '#fff' }}>{this.state.data.data}</Text> : <Text>{this.state.data.summData}</Text>}
            </ScrollView>
            <View style={{ display: 'flex', width: Dimensions.get('window').width, flexDirection: 'row', alignContent: 'space-between', justifyContent: 'center', alignItems: 'center', marginBottom: 80 }}>
              {!this.state.play ? <TouchableOpacity mode="contained" style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onPress={() => this.onStartPlay()}>
                <Icon name='play' size={36} color='#000000' />
              </TouchableOpacity> : <TouchableOpacity mode="contained" style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onPress={() => this.onPausePlay()}>
                <Icon name='pause' size={36} color='#000000' />
              </TouchableOpacity>}
            </View>
          </View>

        )
      }
    }
  }



}
