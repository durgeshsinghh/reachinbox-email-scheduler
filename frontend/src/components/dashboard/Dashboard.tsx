import { useState, useEffect } from 'react';
import Layout from '../layout/Layout';
import Button from '../ui/Button';
import Tabs from '../ui/Tabs';
import Input from '../ui/Input';
import ScheduledEmails from './ScheduledEmails';
import SentEmails from './SentEmails';
import ComposeModal from './ComposeModal';
import { Plus, Search } from 'lucide-react';
import { useEmails } from '../../hooks/useEmails';


export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('scheduled');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { scheduledEmails, sentEmails, fetchScheduled, fetchSent, searchEmails, searchResults, loading } = useEmails();
  
  useEffect(() => {
    fetchScheduled();
    fetchSent();
  }, [fetchScheduled, fetchSent]);

  useEffect(() => {
    const handler = setTimeout(() => {
      searchEmails(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery, searchEmails]);

  const tabs = [
    { key: 'scheduled', label: 'Scheduled', count: scheduledEmails.length },
    { key: 'sent', label: 'Sent', count: sentEmails.length },
  ];

  return (
    <Layout>
      <div className="px-4 sm:px-0 mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Email Dashboard</h1>
        <Button onClick={() => setIsComposeOpen(true)}>
          <Plus size={20} className="mr-2" />
          Compose Email
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <Input
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={18} />}
          />
        </div>
        
        {searchQuery ? (
          <div className="p-4">
             {/* Simple list of search results for now, reuse table maybe */}
             <h3 className="text-lg font-medium mb-4">Search Results</h3>
             {loading ? <p>Loading...</p> : (
               <ul>
                 {searchResults.map(email => (
                   <li key={email.id} className="py-2 border-b">{email.subject} - {email.recipientEmail}</li>
                 ))}
                 {searchResults.length === 0 && <p>No results found.</p>}
               </ul>
             )}
          </div>
        ) : (
          <>
            <div className="px-4">
              <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            </div>
            <div className="p-4">
              {activeTab === 'scheduled' && <ScheduledEmails emails={scheduledEmails} loading={loading} />}
              {activeTab === 'sent' && <SentEmails emails={sentEmails} loading={loading} />}
            </div>
          </>
        )}
      </div>

      <ComposeModal 
        isOpen={isComposeOpen} 
        onClose={() => setIsComposeOpen(false)} 
        onSuccess={() => {
          fetchScheduled();
          setActiveTab('scheduled');
        }}
      />
    </Layout>
  );
}
