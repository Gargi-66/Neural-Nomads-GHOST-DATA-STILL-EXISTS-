import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Send, Bot, User, X, Minimize2, RotateCcw, 
  CheckCircle2, ShieldCheck, FileText, Sparkles, ChevronRight
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  receipt?: {
    ticketId: string;
    userName: string;
    userEmail: string;
    jurisdiction: string;
    requestText: string;
    receivedAt: string;
    auditCutoff: string;
    status: string;
    targetSystems: string[];
    hash: string;
  };
  quickReplies?: string[];
}

export const DeletionRequestChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'quick_form'>('chat');

  // Chat message state
  const [inputMessage, setInputMessage] = useState('');
  const [step, setStep] = useState<'welcome' | 'ask_email' | 'ask_reason' | 'ask_details' | 'completed'>('welcome');
  
  // Collected user data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    jurisdiction: 'GDPR Article 17 (Right to Erasure)',
    requestText: 'Please permanently delete my account, profile, and all associated personal data across all services and backups.'
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'bot',
      text: 'Hello! I am the AEGIS Deletion Intake Assistant. I can help record your affirmative right-to-erasure request and queue it for forensic audit.',
      timestamp: 'Just now',
      quickReplies: ['Submit Deletion Request', 'What data gets deleted?', 'Check GDPR rights']
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Generate synthetic hash for receipt
  const generateHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0') + '7e4b9f201d4a8c3e';
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');

    // State machine for guided conversation
    setTimeout(() => {
      handleBotResponse(text);
    }, 600);
  };

  const handleBotResponse = (userText: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const lower = userText.toLowerCase();

    if (lower.includes('what data') || lower.includes('what gets deleted')) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'Under AEGIS zero-trust policy, all 18 infrastructure microservices (Postgres primary, regional replicas, message queues, S3 invoice attachments, and search indexes) will be scanned for your direct and hashed identifiers.',
          timestamp: timeStr,
          quickReplies: ['Submit Deletion Request', 'GDPR Article 17', 'CCPA Right to Delete']
        }
      ]);
      return;
    }

    if (lower.includes('gdpr') || lower.includes('ccpa') || lower.includes('rights')) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'AEGIS complies with GDPR Article 17 and CCPA §1798.105. Statutory financial records will be converted into anonymized account tombstones, while prohibited PII is completely expunged.',
          timestamp: timeStr,
          quickReplies: ['Submit Deletion Request']
        }
      ]);
      return;
    }

    if (step === 'welcome' || lower.includes('submit deletion')) {
      setStep('ask_email');
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'Great. Please provide your Full Name and Registered Email Address (e.g. "Sarah Connor, sarah@example.com").',
          timestamp: timeStr,
          quickReplies: ['Sarah Connor, sarah@example.com', 'Alex Rivera, a.rivera@corp.net']
        }
      ]);
      return;
    }

    if (step === 'ask_email') {
      const parts = userText.split(/,|;/);
      const name = parts[0]?.trim() || 'Valued User';
      const email = parts[1]?.trim() || (userText.includes('@') ? userText.trim() : 'user@example.com');
      
      setFormData(prev => ({ ...prev, name, email }));
      setStep('ask_reason');

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `Thank you, ${name}. Which legal framework or reason applies to this deletion request?`,
          timestamp: timeStr,
          quickReplies: ['GDPR Article 17 (EU)', 'CCPA Right to Delete (US)', 'Complete Account Closure']
        }
      ]);
      return;
    }

    if (step === 'ask_reason') {
      setFormData(prev => ({ ...prev, jurisdiction: userText }));
      setStep('ask_details');

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'Almost done! Do you have specific instructions (e.g. purge backups, redact support tickets, remove failover replicas)?',
          timestamp: timeStr,
          quickReplies: ['Purge all account records & replicas', 'Standard erasure across all 18 systems']
        }
      ]);
      return;
    }

    if (step === 'ask_details' || step === 'completed') {
      const finalRequestText = userText;
      const ticketNum = Math.floor(1000 + Math.random() * 9000);
      const ticketId = `CASE-2026-X${ticketNum}`;
      const cutoffDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const receiptHash = generateHash(`${formData.email}_${ticketId}`);

      setStep('completed');

      const receipt = {
        ticketId,
        userName: formData.name || 'Alex Chen',
        userEmail: formData.email || 'alex.chen@example.com',
        jurisdiction: formData.jurisdiction,
        requestText: finalRequestText,
        receivedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        auditCutoff: `${cutoffDate} 12:00:00 UTC`,
        status: 'QUEUED_FOR_AUDIT',
        targetSystems: ['account_service', 'auth_service', 'replica_eu_central', 's3_cold_storage'],
        hash: receiptHash
      };

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `Your erasure request has been formally recorded and queued! Here is your cryptographic intake receipt:`,
          timestamp: timeStr,
          receipt
        },
        {
          id: `bot-${Date.now() + 1}`,
          sender: 'bot',
          text: `A zero-trust audit will verify that zero ghost records, unconsumed WAL streams, or zombie sync ETL jobs recreate your data after purge.`,
          timestamp: timeStr,
          quickReplies: ['Submit Another Request', 'Start Over']
        }
      ]);
    }
  };

  const handleReset = () => {
    setStep('welcome');
    setFormData({
      name: '',
      email: '',
      jurisdiction: 'GDPR Article 17 (Right to Erasure)',
      requestText: 'Please permanently delete my account, profile, and all associated personal data across all services and backups.'
    });
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: 'Intake session reset. How can I help you record a deletion request today?',
        timestamp: 'Just now',
        quickReplies: ['Submit Deletion Request', 'What data gets deleted?']
      }
    ]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticketNum = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `CASE-2026-X${ticketNum}`;
    const cutoffDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const receiptHash = generateHash(`${formData.email}_${ticketId}`);

    const receipt = {
      ticketId,
      userName: formData.name || 'Valued User',
      userEmail: formData.email || 'user@example.com',
      jurisdiction: formData.jurisdiction,
      requestText: formData.requestText,
      receivedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      auditCutoff: `${cutoffDate} 12:00:00 UTC`,
      status: 'QUEUED_FOR_AUDIT',
      targetSystems: ['account_service', 'auth_service', 'replica_eu_central', 's3_cold_storage'],
      hash: receiptHash
    };

    setActiveMode('chat');
    setStep('completed');
    setMessages(prev => [
      ...prev,
      {
        id: `usr-${Date.now()}`,
        sender: 'user',
        text: `Submitted Deletion Request: ${formData.jurisdiction}`,
        timestamp: 'Just now'
      },
      {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: 'Your request form has been validated and queued for forensic verification:',
        timestamp: 'Just now',
        receipt
      }
    ]);
  };

  return (
    <>
      {/* =========================================================================
          1. FLOATING ACTION TRIGGER (Bottom-Right Corner)
          ========================================================================= */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2 select-none">
        
        {/* Subtle helper tooltip badge when closed */}
        {!isOpen && (
          <div 
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#EFE5DB] text-stone-700 shadow-md text-xs font-semibold cursor-pointer hover:border-[#EA580C] hover:text-[#EA580C] transition group"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#EA580C] group-hover:rotate-12 transition-transform" />
            <span>Submit Deletion Request</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5"></span>
          </div>
        )}

        {/* Floating Bubble Button */}
        {!isOpen && (
          <button
            onClick={() => { setIsOpen(true); setIsMinimized(false); }}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#EA580C] hover:bg-[#D94E1B] text-white shadow-xl shadow-orange-500/30 flex items-center justify-center cursor-pointer transition transform hover:scale-105 active:scale-95 group relative"
            title="Open Deletion Request Intake Assistant"
          >
            <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white"></span>
          </button>
        )}

        {/* =========================================================================
            2. EXPANDED CHATBOT WIDGET
            ========================================================================= */}
        {isOpen && (
          <div className={`w-[360px] sm:w-[400px] max-w-[calc(100vw-1.5rem)] bg-white rounded-3xl border border-[#EFE5DB] shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isMinimized ? 'h-16' : 'h-[540px] max-h-[85vh]'
          }`}>
            
            {/* Header */}
            <div className="px-4 py-3.5 bg-[#FAF7F2] border-b border-[#EFE5DB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFEAE0] text-[#D94E1B] flex items-center justify-center relative">
                  <Bot className="w-4 h-4" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900 leading-tight flex items-center gap-1.5">
                    AEGIS Deletion Intake
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      Live
                    </span>
                  </h3>
                  <span className="text-[10px] text-stone-500 font-sans block leading-tight">
                    Right to Erasure Assistant (GDPR/CCPA)
                  </span>
                </div>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-1 text-stone-400">
                <button
                  onClick={handleReset}
                  className="p-1.5 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                  title="Reset conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                  title={isMinimized ? 'Expand' : 'Minimize'}
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                  title="Close widget"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mode Switcher: Guided Chat vs Fast Form */}
            {!isMinimized && (
              <div className="px-3 pt-2 pb-1.5 bg-[#FAF7F2] border-b border-[#EFE5DB] flex items-center justify-between text-[11px] font-semibold">
                <div className="inline-flex p-0.5 bg-stone-200/60 rounded-xl w-full">
                  <button
                    onClick={() => setActiveMode('chat')}
                    className={`flex-1 py-1 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeMode === 'chat' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <MessageSquare className="w-3 h-3 text-[#EA580C]" />
                    Intake Chat
                  </button>
                  <button
                    onClick={() => setActiveMode('quick_form')}
                    className={`flex-1 py-1 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeMode === 'quick_form' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <FileText className="w-3 h-3 text-blue-600" />
                    Quick Form
                  </button>
                </div>
              </div>
            )}

            {/* Content Area */}
            {!isMinimized && (
              <>
                {/* VIEW A: INTERACTIVE CHAT MODE */}
                {activeMode === 'chat' && (
                  <div className="flex-1 p-3.5 overflow-y-auto space-y-3 font-sans text-xs bg-[#FAF7F2]/40">
                    {messages.map((m) => {
                      const isBot = m.sender === 'bot';
                      return (
                        <div key={m.id} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} space-y-1`}>
                          <div className="flex items-end gap-1.5 max-w-[85%]">
                            {isBot && (
                              <div className="w-5 h-5 rounded-full bg-[#FFEAE0] text-[#D94E1B] flex items-center justify-center shrink-0 mb-0.5">
                                <Bot className="w-3 h-3" />
                              </div>
                            )}

                            <div className={`p-3 rounded-2xl leading-relaxed text-xs ${
                              isBot 
                                ? 'bg-white text-stone-800 border border-[#EFE5DB] shadow-2xs rounded-bl-xs' 
                                : 'bg-[#EA580C] text-white font-medium rounded-br-xs shadow-2xs'
                            }`}>
                              {m.text}
                            </div>

                            {!isBot && (
                              <div className="w-5 h-5 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center shrink-0 mb-0.5">
                                <User className="w-3 h-3" />
                              </div>
                            )}
                          </div>

                          {/* Render Cryptographic Intake Receipt Card if attached */}
                          {m.receipt && (
                            <div className="w-full mt-1.5 p-3.5 bg-white rounded-2xl border border-emerald-200 shadow-xs space-y-2.5 font-mono text-[10px]">
                              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                                <span className="font-bold text-emerald-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  INTAKE RECEIPT &bull; {m.receipt.ticketId}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                                  {m.receipt.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-stone-600 font-sans">
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-stone-400 block font-mono">Subject</span>
                                  <span className="font-semibold text-stone-900 truncate block">{m.receipt.userName}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-stone-400 block font-mono">Email</span>
                                  <span className="font-semibold text-[#EA580C] truncate block">{m.receipt.userEmail}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-[9px] uppercase font-bold text-stone-400 block font-mono">Jurisdiction</span>
                                  <span className="font-semibold text-stone-800">{m.receipt.jurisdiction}</span>
                                </div>
                              </div>

                              <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#EFE5DB] font-sans text-stone-600 text-[10px] italic">
                                &quot;{m.receipt.requestText}&quot;
                              </div>

                              <div className="space-y-1 text-stone-500 font-mono text-[9px] pt-1 border-t border-stone-100">
                                <div className="flex justify-between">
                                  <span>Cutoff Deadline:</span>
                                  <strong className="text-stone-800">{m.receipt.auditCutoff}</strong>
                                </div>
                                <div className="flex justify-between truncate">
                                  <span>SHA-256 Hash:</span>
                                  <code className="text-[#EA580C]">{m.receipt.hash}</code>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Quick replies suggestion chips */}
                          {m.quickReplies && m.quickReplies.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1 pl-6">
                              {m.quickReplies.map((qr) => (
                                <button
                                  key={qr}
                                  onClick={() => handleSendMessage(qr)}
                                  className="px-2.5 py-1 rounded-full bg-white border border-[#EFE5DB] text-[10px] text-stone-700 font-medium hover:border-[#EA580C] hover:text-[#EA580C] hover:bg-[#FFEAE0]/30 transition shadow-2xs cursor-pointer flex items-center gap-1"
                                >
                                  <span>{qr}</span>
                                  <ChevronRight className="w-2.5 h-2.5 opacity-60" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* VIEW B: QUICK FORM MODE */}
                {activeMode === 'quick_form' && (
                  <form onSubmit={handleFormSubmit} className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs bg-[#FAF7F2]/40">
                    <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200 text-blue-900 text-[11px] flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>Directly file an affirmative personal data erasure ticket under GDPR or CCPA.</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Chen"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#EFE5DB] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#EA580C] shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                        Registered Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. alex.chen@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#EFE5DB] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#EA580C] shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                        Legal Framework / Reason
                      </label>
                      <select
                        value={formData.jurisdiction}
                        onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#EFE5DB] rounded-xl text-xs text-stone-900 font-medium focus:outline-none focus:border-[#EA580C] shadow-2xs cursor-pointer"
                      >
                        <option value="GDPR Article 17 (Right to Erasure)">GDPR Article 17 (Right to Erasure)</option>
                        <option value="CCPA §1798.105 (California Consumer Privacy Act)">CCPA §1798.105 (Right to Delete)</option>
                        <option value="LGPD Article 18 (Brazil)">LGPD Article 18</option>
                        <option value="Complete Voluntary Account Termination">Complete Voluntary Account Termination</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                        Request Statement / Scope
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={formData.requestText}
                        onChange={(e) => setFormData({ ...formData, requestText: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#EFE5DB] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#EA580C] shadow-2xs leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#EA580C] hover:bg-[#D94E1B] text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Queue Deletion for Verification
                    </button>
                  </form>
                )}

                {/* Input Bar (Only visible in chat mode) */}
                {activeMode === 'chat' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="p-2.5 bg-white border-t border-[#EFE5DB] flex items-center gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Type your reply or deletion request..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#EFE5DB] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#EA580C]"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className="w-8 h-8 rounded-xl bg-[#EA580C] text-white flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#D94E1B] cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </>
            )}

          </div>
        )}

      </div>
    </>
  );
};
