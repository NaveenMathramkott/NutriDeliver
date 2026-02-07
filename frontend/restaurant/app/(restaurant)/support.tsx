import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ViewStyle, TextStyle } from 'react-native';
import { globalStyles } from '../../styles/global';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SupportScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleContact = (type: 'phone' | 'email') => {
    if (type === 'phone') {
      Linking.openURL('tel:+1234567890');
    } else {
      Linking.openURL('mailto:support@nutrideliver.com');
    }
  };

  const handleSubmitTicket = () => {
    if (!subject || !message) return;
    // Mock submission
    alert('Support ticket submitted successfully. We will get back to you soon.');
    setSubject('');
    setMessage('');
  };

  return (
    <ScrollView style={globalStyles.container as ViewStyle} contentContainerStyle={styles.content}>
      <View style={styles.header as ViewStyle}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title as TextStyle}>Support & Help</Text>
      </View>

      <Text style={styles.sectionTitle as TextStyle}>Quick Contact</Text>
      <View style={styles.contactRow as ViewStyle}>
        <TouchableOpacity style={styles.contactCard} onPress={() => handleContact('phone')}>
          <Ionicons name="call" size={30} color={Colors.primary} />
          <Text style={styles.contactLabel as TextStyle}>Call Us</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactCard} onPress={() => handleContact('email')}>
          <Ionicons name="mail" size={30} color={Colors.primary} />
          <Text style={styles.contactLabel as TextStyle}>Email Support</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle as TextStyle}>Submit a Ticket</Text>
      <Card>
        <Text style={styles.label}>Subject</Text>
        <Input 
          placeholder="What do you need help with?"
          value={subject}
          onChangeText={setSubject}
        />
        <Text style={styles.label}>Message</Text>
        <Input 
          placeholder="Describe your issue in detail..."
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={5}
          style={styles.textArea}
        />
        <Button 
          title="Submit Ticket" 
          onPress={handleSubmitTicket}
          disabled={!subject || !message}
        />
      </Card>

      <Text style={styles.sectionTitle as TextStyle}>Frequently Asked Questions</Text>
      {[
        { q: 'How do I update my menu?', a: 'Go to the Menu tab and click "Add Item" or the edit icon next to an existing item.' },
        { q: 'When do I get my payouts?', a: 'Payouts are processed every Monday for the previous week\'s earnings.' },
        { q: 'Can I set custom preparation times?', a: 'Yes, you can set a custom preparation time for each order during the "Preparing" phase.' },
      ].map((faq, index) => (
        <Card key={index} style={styles.faqCard as ViewStyle}>
          <Text style={styles.faqQuestion as TextStyle}>{faq.q}</Text>
          <Text style={styles.faqAnswer as TextStyle}>{faq.a}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    marginTop: 8,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  contactCard: {
    flex: 0.48,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactLabel: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  faqCard: {
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: Colors.text + '80',
    lineHeight: 20,
  },
});
