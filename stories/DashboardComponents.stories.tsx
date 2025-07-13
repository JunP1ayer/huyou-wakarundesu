import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import ManualIncomeCard from '../components/dashboard/ManualIncomeCard';
import WebhookSimulator from '../components/dashboard/WebhookSimulator';

// Manual Income Card Stories
const ManualIncomeCardMeta: Meta<typeof ManualIncomeCard> = {
  title: 'Dashboard/ManualIncomeCard',
  component: ManualIncomeCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Manual income tracking component for non-automated income sources like cash payments.'
      }
    }
  },
  argTypes: {
    isVisible: {
      control: 'boolean',
      description: 'Show/hide the component based on user settings'
    },
    userId: {
      control: 'text',
      description: 'User ID for data operations'
    }
  }
};

export default ManualIncomeCardMeta;

export const ManualIncomeVisible: StoryObj<typeof ManualIncomeCard> = {
  args: {
    isVisible: true,
    userId: 'demo-user-123'
  }
};

export const ManualIncomeHidden: StoryObj<typeof ManualIncomeCard> = {
  args: {
    isVisible: false,
    userId: 'demo-user-123'
  }
};

export const ManualIncomeLoading: StoryObj<typeof ManualIncomeCard> = {
  args: {
    isVisible: true,
    userId: 'demo-user-123'
  },
  parameters: {
    mockData: {
      loading: true
    }
  }
};

// Webhook Simulator Stories
const WebhookSimulatorMeta: Meta<typeof WebhookSimulator> = {
  title: 'Dashboard/WebhookSimulator',
  component: WebhookSimulator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Bank webhook simulator for testing deposit classification and income tracking.'
      }
    }
  }
};

export const WebhookSimulatorDefault: StoryObj<typeof WebhookSimulator> = {
  args: {
    userId: 'demo-user-123'
  }
};

export const WebhookSimulatorWithResult: StoryObj<typeof WebhookSimulator> = {
  args: {
    userId: 'demo-user-123'
  },
  play: async ({ canvasElement }) => {
    // This would simulate a successful webhook result
    // In a real scenario, this might be set up with MSW (Mock Service Worker)
  }
};

// Combined Dashboard View Story
const DashboardDemo = ({ userId }: { userId: string }) => {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f5f5f5', 
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ marginBottom: '30px', color: '#333' }}>
        🎯 扶養わかるんです - Dashboard Demo
      </h1>
      
      <div style={{ 
        display: 'grid', 
        gap: '20px', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        maxWidth: '1200px'
      }}>
        <ManualIncomeCard isVisible={true} userId={userId} />
        <WebhookSimulator userId={userId} />
      </div>
      
      {/* Mock Dashboard Stats */}
      <div style={{ 
        marginTop: '30px',
        display: 'grid', 
        gap: '15px', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        maxWidth: '800px'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>今年の収入</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
            ¥850,000
          </p>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>残り限度額</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
            ¥650,000
          </p>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>達成率</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
            56.7%
          </p>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>ステータス</h3>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>
            ✅ 安全
          </p>
        </div>
      </div>
    </div>
  );
};

const DashboardDemoMeta: Meta<typeof DashboardDemo> = {
  title: 'Dashboard/Complete Dashboard',
  component: DashboardDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Complete dashboard view showing all components working together.'
      }
    }
  }
};

export const CompleteDashboard: StoryObj<typeof DashboardDemo> = {
  args: {
    userId: 'demo-user-123'
  }
};