import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { AdminWorkspace } from './features/AdminTool/AdminWorkspace';
import { EditorWorkspace } from './features/EditorTool/EditorWorkspace';
import { MergeWorkspace } from './features/MergeTool/MergeWorkspace';
import { SplitWorkspace } from './features/SplitTool/SplitWorkspace';
import { CompressWorkspace } from './features/CompressTool/CompressWorkspace';
import { SignWorkspace } from './features/SignTool/SignWorkspace';
import { OrganizerWorkspace } from './features/OrganizerTool/OrganizerWorkspace';
import { SecurityWorkspace } from './features/SecurityTool/SecurityWorkspace';
import { WatermarkRemoverWorkspace } from './features/SecurityTool/WatermarkRemoverWorkspace';
import { ConverterWorkspace } from './features/ConverterTool/ConverterWorkspace';
import { UnlockWorkspace } from './features/UnlockTool/UnlockWorkspace';
import { PageNumbersWorkspace } from './features/PageNumbersTool/PageNumbersWorkspace';
import { PdfToJpgWorkspace } from './features/PdfToJpgTool/PdfToJpgWorkspace';
import { OcrWorkspace } from './features/OcrTool/OcrWorkspace';
import { RedactWorkspace } from './features/RedactTool/RedactWorkspace';
import { CustomFeatureWorkspace } from './features/CustomTool/CustomFeatureWorkspace';
import { RepairWorkspace } from './features/RepairTool/RepairWorkspace';
import { MarkdownWorkspace } from './features/MarkdownTool/MarkdownWorkspace';

export function App() {
  const [activeTool, setActiveTool] = useState(null);
  const [notification, setNotification] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState('user');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('agent_krishna_user');
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } catch (e) { console.error(e); }
    }
  }, []);

  const handleLogin = (user) => { setCurrentUser(user); localStorage.setItem('agent_krishna_user', JSON.stringify(user)); showNotification(`Welcome back, ${user.name}!`, 'success'); };
  const handleLogout = () => { setCurrentUser(null); localStorage.removeItem('agent_krishna_user'); showNotification('Logged out.', 'success'); };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const renderActiveToolWorkspace = () => {
    const deletedMenus = (() => {
      try {
        return JSON.parse(localStorage.getItem('agent_krishna_deleted_menus') || '[]');
      } catch (e) {
        return [];
      }
    })();

    if (activeTool && deletedMenus.includes(activeTool)) {
      return <Dashboard onSelectTool={setActiveTool} currentUser={currentUser} onOpenAuth={() => { setAuthModalInitialTab('user'); setIsAuthModalOpen(true); }} onOpenAccount={() => setIsAccountModalOpen(true)} />;
    }

    if (activeTool && activeTool.startsWith('ai_custom_')) return <CustomFeatureWorkspace toolId={activeTool} toolName="Custom AI Tool" onBack={() => setActiveTool(null)} />;

    switch (activeTool) {
      case 'admin': return <AdminWorkspace currentUser={currentUser} onRequireAuth={() => { setAuthModalInitialTab('admin'); setIsAuthModalOpen(true); }} onNotify={showNotification} onBack={() => setActiveTool(null)} />;
      case 'repair': return <RepairWorkspace onBack={() => setActiveTool(null)} />;
      case 'pdf-to-markdown': return <MarkdownWorkspace onBack={() => setActiveTool(null)} />;
      case 'editor': return <EditorWorkspace onBack={() => setActiveTool(null)} />;
      case 'unlock': return <UnlockWorkspace onBack={() => setActiveTool(null)} />;
      case 'ocr-pdf': return <OcrWorkspace currentUser={currentUser} onRequireAuth={() => { setAuthModalInitialTab('user'); setIsAuthModalOpen(true); }} onBack={() => setActiveTool(null)} />;
      case 'redact-pdf': return <RedactWorkspace currentUser={currentUser} onRequireAuth={() => { setAuthModalInitialTab('user'); setIsAuthModalOpen(true); }} onBack={() => setActiveTool(null)} />;
      case 'watermark-remover': return <WatermarkRemoverWorkspace onBack={() => setActiveTool(null)} />;
      case 'merge': return <MergeWorkspace onNotify={showNotification} onBack={() => setActiveTool(null)} />;
      case 'split': return <SplitWorkspace onNotify={showNotification} onBack={() => setActiveTool(null)} />;
      case 'compress': return <CompressWorkspace onNotify={showNotification} onBack={() => setActiveTool(null)} />;
      case 'sign': return <SignWorkspace onNotify={showNotification} onBack={() => setActiveTool(null)} />;
      case 'organizer': return <OrganizerWorkspace onNotify={showNotification} onBack={() => setActiveTool(null)} />;
      case 'security': return <SecurityWorkspace onNotify={showNotification} onBack={() => setActiveTool(null)} />;
      case 'converter': return <ConverterWorkspace onNotify={showNotification} onBack={() => setActiveTool(null)} />;
      case 'page-numbers': return <PageNumbersWorkspace onNotify={showNotification} onBack={() => setActiveTool(null)} />;
      case 'pdf-to-jpg': return <PdfToJpgWorkspace onNotify={showNotification} onBack={() => setActiveTool(null)} />;
      default: return <Dashboard onSelectTool={setActiveTool} currentUser={currentUser} onOpenAuth={() => { setAuthModalInitialTab('user'); setIsAuthModalOpen(true); }} onOpenAccount={() => setIsAccountModalOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header activeTool={activeTool} onSelectTool={setActiveTool} currentUser={currentUser} onOpenAuth={() => { setAuthModalInitialTab('user'); setIsAuthModalOpen(true); }} onLogout={handleLogout} onOpenAccount={() => setIsAccountModalOpen(true)} />
      <main className="flex-1 flex flex-col">{renderActiveToolWorkspace()}</main>
      {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} initialTab={authModalInitialTab} onClose={() => setIsAuthModalOpen(false)} onLogin={handleLogin} />}
      {isAccountModalOpen && <AccountSettingsModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} currentUser={currentUser} onUpdateUser={setCurrentUser} onDeleteAccount={handleLogout} />}
    </div>
  );
}
