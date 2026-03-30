import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

// Colors based on the design screenshot
const COLORS = {
  primary: '#1E8E3E', // Green
  secondary: '#E8F5E9', // Light Green (for protocol box)
  botBubble: '#FFFFFF',
  textHeader: '#333333',
  textSecondary: '#666666',
  background: '#F9FAFB',
  gridLine: '#E5E7EB',
};

export default function App() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Merhaba! Ben B.E.G.U.M. (Biomedical Expert Generative User Mobile).',
      type: 'bot',
      time: '09:40 AM',
      sender: 'BEGUM AI',
    },
    {
      id: 2,
      text: "Hello Sarah. I've noticed a 15% increase in your resting heart rate over the last 48 hours. How are you feeling today? Are you experiencing any specific symptoms like fatigue or headaches?",
      type: 'bot',
      time: '09:41 AM',
      sender: 'BEGUM AI',
    },
    {
      id: 3,
      text: "I've been feeling quite sluggish since yesterday afternoon. A bit of a dull headache behind my eyes too.",
      type: 'user',
      time: '09:43 AM',
      sender: 'YOU',
    },
    {
      id: 4,
      text: "Understood. Based on your cycle tracking and the heart rate data, this might be related to mild dehydration or early signs of a tension headache.\n\nCould you rate your pain on a scale of 1 to 10? Also, have you noticed any sensitivity to light?",
      type: 'bot',
      time: '09:44 AM',
      sender: 'BEGUM AI',
    },
    {
      id: 5,
      text: "The pain is about a 4. Not too bad, but definitely there. No light sensitivity yet, just feels heavy.",
      type: 'user',
      time: 'Just now',
      sender: 'YOU',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const SERPER_API_KEY = 'a1629159441ee795f821ce2fd96c99d084fcfb69';


  const [confirmedAppointments, setConfirmedAppointments] = useState({});

  const handleBookAppointment = (messageId, doctor, slot) => {
    setConfirmedAppointments(prev => ({
      ...prev,
      [messageId]: { doctor, slot }
    }));
  };

  const renderMessage = ({ item }) => {
    const isBot = item.type === 'bot';
    const isAppointment = item.type === 'appointment_card';

    if (isAppointment) {
      const confirmation = confirmedAppointments[item.id];
      return (
        <View style={[styles.messageContainer, styles.botContainer, { maxWidth: '90%' }]}>
          <View style={styles.messageHeader}>
            <Text style={styles.senderName}>{item.sender}</Text>
            <Text style={styles.timestamp}>{item.time}</Text>
          </View>
          <View style={[styles.bubble, styles.appointmentCard]}>
            <Text style={styles.cardTitle}>{item.department} Bölümü Randevu</Text>
            <Text style={styles.cardSubtitle}>Uygun Uzmanlar ve Saatler:</Text>
            
            {item.doctors.map((doc, dIdx) => (
              <View key={dIdx} style={styles.doctorSection}>
                <Text style={styles.doctorName}>{doc}</Text>
                <View style={styles.slotGrid}>
                  {item.slots.map((slot, sIdx) => (
                    <TouchableOpacity 
                      key={sIdx} 
                      style={[
                        styles.slotBtn, 
                        confirmation?.doctor === doc && confirmation?.slot === slot ? styles.slotBtnSelected : null
                      ]}
                      onPress={() => handleBookAppointment(item.id, doc, slot)}
                    >
                      <Text style={[
                        styles.slotText,
                        confirmation?.doctor === doc && confirmation?.slot === slot ? styles.slotTextSelected : null
                      ]}>{slot}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {confirmation && (
              <View style={styles.confirmationBox}>
                <Ionicons name="checkmark-circle" size={16} color="#1E8E3E" />
                <Text style={styles.confirmationText}>
                  Randevunuz onaylandı: {confirmation.doctor} - {confirmation.slot}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, isBot ? styles.botContainer : styles.userContainer]}>
        <View style={[styles.messageHeader, isBot ? null : { justifyContent: 'flex-end' }]}>
          {isBot && <Text style={styles.senderName}>{item.sender}</Text>}
          <Text style={styles.timestamp}>{item.time}</Text>
          {!isBot && <Text style={styles.senderName}> {item.sender}</Text>}
        </View>
        <View style={[styles.bubble, isBot ? styles.botBubble : styles.userBubble]}>
          {isBot && item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
          <Text style={[styles.messageText, isBot ? styles.botText : styles.userText]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  const fetchSerperData = async (query) => {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query + " hangi tıbbi bölüme gidilmeli?" }),
      });
      const data = await response.json();
      
      if (data.organic && data.organic.length > 0) {
        const bestSnippet = data.organic[0].snippet;
        return {
          text: bestSnippet,
          category: 'Analiz Sonucu'
        };
      }
      return { text: "Üzgünüm, bu konuda net bir tıbbi veriye şu an ulaşamadım. Lütfen bir uzmana danışın.", category: "Hata" };
    } catch (error) {
      console.error(error);
      return { text: "Bağlantı sorunu nedeniyle veriye ulaşamadım.", category: "Hata" };
    }
  };




  const sendMessage = async () => {
    if (inputText.trim() === '') return;
    
    const userMsgText = inputText;
    const newMessage = {
      id: Date.now(),
      text: userMsgText,
      type: 'user',
      time: 'Just now',
      sender: 'YOU',
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Simulate/Show typing indicator
    setIsTyping(true);

    // Call Serper Search
    const searchResult = await fetchSerperData(userMsgText);
    
    const botResponse = {
      id: Date.now() + 1,
      text: searchResult.text,
      category: searchResult.category,
      type: 'bot',
      time: 'Just now',
      sender: 'BEGUM AI',
    };

    const appointmentCard = {
      id: Date.now() + 2,
      type: 'appointment_card',
      category: 'Randevu Planlama',
      department: searchResult.category || 'Genel Sağlık',
      doctors: ['Dr. Ali Yılmaz', 'Dr. Ayşe Kaya'],
      slots: ['09:00', '10:30', '14:00'],
      time: 'Just now',
      sender: 'BEGUM AI',
    };

    setMessages(prev => [...prev, botResponse, appointmentCard]);
    setIsTyping(false);
  };




  const flatListRef = React.useRef(null);

  React.useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn}>
          <Feather name="menu" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BEGUM Health Agent</Text>
        <TouchableOpacity style={styles.profileBtn}>
          <View style={styles.profileCircle}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100' }} 
              style={styles.profileImage}
            />
          </View>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Background Grid */}
        <View style={styles.gridOverlay} pointerEvents="none">
          {[...Array(20)].map((_, i) => (
            <View key={`h-${i}`} style={[styles.gridLineH, { top: i * 60 }]} />
          ))}
          {[...Array(10)].map((_, i) => (
            <View key={`v-${i}`} style={[styles.gridLineV, { left: i * 40 }]} />
          ))}
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}

          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.protocolBox}>
              <View style={styles.protocolIcon}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.protocolTextContainer}>
                <Text style={styles.protocolTitle}>Clinical Protocol Active</Text>
                <Text style={styles.protocolDesc}>
                  Your data is encrypted. I am currently monitoring your reported fatigue levels in context with your recent biometric records.
                </Text>
              </View>
            </View>
          }
          ListFooterComponent={
            isTyping && (
              <View style={[styles.messageContainer, styles.botContainer]}>
                <View style={styles.messageHeader}>
                  <Text style={styles.senderName}>BEGUM AI</Text>
                </View>
                <View style={[styles.bubble, styles.botBubble, { paddingHorizontal: 12, paddingVertical: 8 }]}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>B.E.G.U.M. araştırıyor...</Text>
                </View>
              </View>
            )
          }
        />


        {/* Input Area */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.addBtn}>
              <Feather name="plus-circle" size={24} color="#A0AEC0" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Describe your symptoms..."
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendBtn, inputText.trim() === '' ? { opacity: 0.6 } : null]} 
              onPress={sendMessage}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Navbar */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <View style={styles.activeNavBg}>
              <Ionicons name="chatbubble-ellipses" size={22} color={COLORS.primary} />
              <Text style={styles.activeNavText}>CHAT</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <MaterialCommunityIcons name="file-document-outline" size={24} color="#A0AEC0" />
            <Text style={styles.navText}>RECORDS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
             <Ionicons name="calendar-outline" size={22} color="#A0AEC0" />
            <Text style={styles.navText}>CALENDAR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="settings-outline" size={22} color="#A0AEC0" />
            <Text style={styles.navText}>SETTINGS</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerBtn: {
    padding: 4,
  },
  profileCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEE',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    zIndex: -1,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#000',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#000',
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  protocolBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(30, 142, 62, 0.1)',
  },
  protocolIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 142, 62, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  protocolTextContainer: {
    flex: 1,
  },
  protocolTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  protocolDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  botContainer: {
    alignSelf: 'flex-start',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 10,
    color: '#9CA3AF',
    marginLeft: 6,
  },
  bubble: {
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  botBubble: {
    backgroundColor: '#1E8E3E', // Emerald Green as requested
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderTopLeftRadius: 0,
  },
  userBubble: {
    backgroundColor: '#F3F4F6', // Light gray for user
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 0,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  botText: {
    color: '#FFFFFF',
  },
  userText: {
    color: '#374151',
  },
  categoryBadge: {
    backgroundColor: 'rgba(30, 142, 62, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    width: '100%',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  doctorSection: {
    marginBottom: 12,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  slotBtnSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#1E8E3E',
  },
  slotText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  slotTextSelected: {
    color: '#1E8E3E',
    fontWeight: '700',
  },
  confirmationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(30, 142, 62, 0.2)',
  },
  confirmationText: {
    fontSize: 12,
    color: '#1E8E3E',
    fontWeight: '600',
    marginLeft: 6,
  },
  inputSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 6,
    paddingVertical: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addBtn: {
    padding: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 15,
    color: '#333',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNavBg: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  activeNavText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  navText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A0AEC0',
    marginTop: 4,
  },
});
