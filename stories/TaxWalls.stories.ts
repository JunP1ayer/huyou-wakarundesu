import type { Meta, StoryObj } from '@storybook/react';
import { decideThreshold, calculateDangerLevel, getThresholdBreakdown, WALLS } from '../lib/tax-walls';

// Mock component to display tax wall calculations
const TaxWallsDemo = ({ 
  dob, 
  student, 
  insurance_status, 
  currentIncome,
  future_self_ins_date 
}: {
  dob: Date;
  student: boolean;
  insurance_status: 'parent' | 'self';
  currentIncome: number;
  future_self_ins_date?: Date;
}) => {
  const thresholdResult = decideThreshold({
    dob,
    student,
    insurance_status,
    future_self_ins_date
  });

  const breakdown = getThresholdBreakdown(currentIncome, thresholdResult);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '600px' }}>
      <h1>🎯 扶養わかるんです - Tax Walls Calculator</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
        <h2>User Profile</h2>
        <p><strong>Age:</strong> {Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years old</p>
        <p><strong>Student:</strong> {student ? 'Yes' : 'No'}</p>
        <p><strong>Insurance:</strong> {insurance_status === 'parent' ? 'Parent\'s insurance' : 'Self-insured'}</p>
        {future_self_ins_date && (
          <p><strong>Future Insurance Date:</strong> {future_self_ins_date.toDateString()}</p>
        )}
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0fff0', borderRadius: '8px' }}>
        <h2>Threshold Calculation</h2>
        <p><strong>Current Wall:</strong> ¥{thresholdResult.currentWall.toLocaleString()}</p>
        <p><strong>Wall Type:</strong> {thresholdResult.currentWallType}</p>
        <p><strong>Independent Mode:</strong> {thresholdResult.isIndependentMode ? 'Yes' : 'No'}</p>
        <p><strong>Resident Tax Wall:</strong> ¥{thresholdResult.residentWall.toLocaleString()}</p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff8f0', borderRadius: '8px' }}>
        <h2>Income Analysis</h2>
        <p><strong>Current Income:</strong> ¥{breakdown.currentIncome.toLocaleString()}</p>
        <p><strong>Threshold:</strong> ¥{breakdown.threshold.toLocaleString()}</p>
        <p><strong>Remaining Allowance:</strong> ¥{breakdown.remainingAllowance.toLocaleString()}</p>
        <p><strong>Usage Percentage:</strong> {breakdown.percentage.toFixed(1)}%</p>
        <p><strong>Danger Level:</strong> 
          <span style={{ 
            color: breakdown.dangerLevel === 'safe' ? 'green' : 
                   breakdown.dangerLevel === 'warn' ? 'orange' : 'red',
            fontWeight: 'bold',
            marginLeft: '5px'
          }}>
            {breakdown.dangerLevel.toUpperCase()}
          </span>
        </p>
        <p><strong>Recommended Monthly Income:</strong> ¥{breakdown.recommendedMonthlyIncome.toLocaleString()}</p>
      </div>

      <div style={{ padding: '15px', backgroundColor: '#f8f0ff', borderRadius: '8px' }}>
        <h2>2025 Tax Walls Reference</h2>
        <ul>
          <li><strong>Resident Tax:</strong> ¥{WALLS.resident.toLocaleString()}</li>
          <li><strong>Income Tax (General):</strong> ¥{WALLS.incomeGeneral.toLocaleString()}</li>
          <li><strong>Income Tax (Student 19-22):</strong> ¥{WALLS.incomeStudent.toLocaleString()}</li>
          <li><strong>Social Insurance:</strong> ¥{WALLS.socialInsurance.toLocaleString()}</li>
        </ul>
      </div>
    </div>
  );
};

const meta: Meta<typeof TaxWallsDemo> = {
  title: 'Tax Walls/Calculator',
  component: TaxWallsDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Interactive demonstration of the 2025 Japanese tax threshold calculation system.'
      }
    }
  },
  argTypes: {
    dob: {
      control: 'date',
      description: 'Date of birth for age calculation'
    },
    student: {
      control: 'boolean',
      description: 'Whether the person is a student'
    },
    insurance_status: {
      control: 'select',
      options: ['parent', 'self'],
      description: 'Insurance status'
    },
    currentIncome: {
      control: { type: 'number', min: 0, max: 2000000, step: 10000 },
      description: 'Current yearly income in yen'
    },
    future_self_ins_date: {
      control: 'date',
      description: 'Future date when switching to self-insurance'
    }
  }
};

export default meta;
type Story = StoryObj<typeof TaxWallsDemo>;

export const Student19General: Story = {
  args: {
    dob: new Date('2005-06-01'), // 19 years old
    student: true,
    insurance_status: 'parent',
    currentIncome: 800000
  }
};

export const Student21Special: Story = {
  args: {
    dob: new Date('2003-03-01'), // 21 years old  
    student: true,
    insurance_status: 'parent',
    currentIncome: 1200000
  }
};

export const NonStudentWorker: Story = {
  args: {
    dob: new Date('1998-01-01'), // 26 years old
    student: false,
    insurance_status: 'parent',
    currentIncome: 1100000
  }
};

export const SelfInsuredWorker: Story = {
  args: {
    dob: new Date('2000-01-01'), // 24 years old
    student: false,
    insurance_status: 'self',
    currentIncome: 1400000
  }
};

export const FutureSelfInsurance: Story = {
  args: {
    dob: new Date('2002-01-01'), // 22 years old
    student: true,
    insurance_status: 'parent',
    currentIncome: 1000000,
    future_self_ins_date: new Date('2025-04-01')
  }
};

export const DangerLevel: Story = {
  args: {
    dob: new Date('2003-01-01'), // 21 years old
    student: true,
    insurance_status: 'parent',
    currentIncome: 1480000 // Very close to student limit
  }
};

export const SafeLevel: Story = {
  args: {
    dob: new Date('2005-01-01'), // 19 years old
    student: true,
    insurance_status: 'parent',
    currentIncome: 600000 // Well below any threshold
  }
};