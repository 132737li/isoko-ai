import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistant() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMessages([
      { 
        role: 'assistant', 
        content: "Bonjour ! Je suis votre assistant Isoko AI. Vous pouvez me poser des questions sur vos ventes, vos stocks, ou me demander des conseils pour votre boutique." 
      }
    ]);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    let activeShopId = localStorage.getItem('active_shop_id');
    let shopContext = "Aucune donnée de boutique disponible.";
    
    if (activeShopId) {
      const { data: products } = await supabase
        .from('products')
        .select('name, quantity, low_stock_threshold')
        .eq('shop_id', activeShopId)
        .eq('is_archived', false);
        
      if (products && products.length > 0) {
        shopContext = "Voici l'état actuel des stocks de ma boutique :\n" + 
          products.map(p => `- ${p.name}: ${p.quantity} en stock (Seuil d'alerte: ${p.low_stock_threshold})`).join('\n');
      } else {
        shopContext = "Ma boutique n'a pas encore de produits enregistrés.";
      }
    }

    const prompt = `Tu es un assistant commercial pour une boutique au Burundi. Sois concis et utile. 
    Contexte de la boutique : ${shopContext}
    
    Question de l'utilisateur : ${userMessage}`;

    try {
      const { data, error } = await supabase.functions.invoke('ai-helper', {
        body: { prompt }
      });

      if (error) throw new Error(error.message);

      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, une erreur est survenue. Veuillez réessayer." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Bot className="text-purple-600" /> {t('ai_assistant_title')}
        </h1>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link to="/dashboard" className="text-teal-600 hover:underline">{t('back_dashboard')}</Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 flex flex-col">
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-y-auto mb-4 flex flex-col gap-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-teal-100 text-teal-600' : 'bg-purple-100 text-purple-600'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-lg max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="p-3 rounded-lg bg-gray-100 text-gray-500 text-sm animate-pulse">
                {t('ai_thinking')}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('ai_placeholder')}
            className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
            disabled={isLoading}
          />
          <Button type="submit" isLoading={isLoading} className="px-6">
            <Send size={18} />
          </Button>
        </form>
      </main>
    </div>
  );
}