import SpeechToText from 'react-native-google-speech-to-text';
import {View, Text, TouchableOpacity} from 'react-native'

export default function Speech(){
    const speechToTextHandler = async () => {

        let speechToTextData = null;
            try {
                speechToTextData = await SpeechToText.startSpeech('Try saying something', 'en_IN');
                console.log('speechToTextData: ', speechToTextData);
    
            } catch (error) {
                console.log('error: ', error);
            }
    }
    return(
        <TouchableOpacity onPress={() => speechToTextHandler()}>
            <Text>Click on me </Text>
        </TouchableOpacity>
    )
}