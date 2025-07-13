'use client';

import React, { useState } from 'react';
import { OnboardingAnswers } from '@/types/onboarding';
import { STEP_CONFIGS } from '@/types/onboarding';
import { Briefcase, ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface Job {
  id?: string;
  employer_name: string;
  job_type: 'part_time' | 'full_time' | 'freelance' | 'other';
  hourly_rate?: number;
  expected_monthly_hours?: number;
}

interface Props {
  answers: OnboardingAnswers;
  updateAnswers: (answers: Partial<OnboardingAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  isLoading: boolean;
}

export default function ScreenJobs({ answers, updateAnswers, onNext, onBack, canGoBack, isLoading }: Props) {
  const config = STEP_CONFIGS.ScreenJobs;
  const [jobs, setJobs] = useState<Job[]>(answers.jobs || []);
  const [newJob, setNewJob] = useState<Job>({
    employer_name: '',
    job_type: 'part_time',
    hourly_rate: undefined,
    expected_monthly_hours: undefined
  });

  const addJob = () => {
    if (newJob.employer_name.trim()) {
      const updatedJobs = [...jobs, { ...newJob, id: Date.now().toString() }];
      setJobs(updatedJobs);
      setNewJob({
        employer_name: '',
        job_type: 'part_time',
        hourly_rate: undefined,
        expected_monthly_hours: undefined
      });
    }
  };

  const removeJob = (index: number) => {
    const updatedJobs = jobs.filter((_, i) => i !== index);
    setJobs(updatedJobs);
  };

  const handleNext = () => {
    updateAnswers({ jobs });
    onNext();
  };

  const getJobTypeLabel = (type: string) => {
    const labels = {
      part_time: 'アルバイト',
      full_time: '正社員',
      freelance: 'フリーランス',
      other: 'その他'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {config.title}
        </h2>
        <p className="text-gray-600">
          {config.description}
        </p>
      </div>

      <div className="space-y-6 text-left">
        {/* Existing Jobs */}
        {jobs.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">登録済みの勤務先</h3>
            {jobs.map((job, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{job.employer_name}</p>
                  <p className="text-sm text-gray-600">
                    {getJobTypeLabel(job.job_type)}
                    {job.hourly_rate && job.expected_monthly_hours && (
                      <span> • 時給{job.hourly_rate}円 • 月{job.expected_monthly_hours}時間</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => removeJob(index)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Job */}
        <div className="bg-indigo-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            勤務先を追加
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                勤務先名
              </label>
              <input
                type="text"
                value={newJob.employer_name}
                onChange={(e) => setNewJob(prev => ({ ...prev, employer_name: e.target.value }))}
                placeholder="例: セブンイレブン○○店"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                雇用形態
              </label>
              <select
                value={newJob.job_type}
                onChange={(e) => setNewJob(prev => ({ ...prev, job_type: e.target.value as Job['job_type'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="part_time">アルバイト・パート</option>
                <option value="full_time">正社員・契約社員</option>
                <option value="freelance">フリーランス・業務委託</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  時給（円）
                </label>
                <input
                  type="number"
                  value={newJob.hourly_rate || ''}
                  onChange={(e) => setNewJob(prev => ({ ...prev, hourly_rate: Number(e.target.value) || undefined }))}
                  placeholder="1000"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  月間予定時間
                </label>
                <input
                  type="number"
                  value={newJob.expected_monthly_hours || ''}
                  onChange={(e) => setNewJob(prev => ({ ...prev, expected_monthly_hours: Number(e.target.value) || undefined }))}
                  placeholder="80"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={addJob}
              disabled={!newJob.employer_name.trim()}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              追加
            </button>
          </div>
        </div>

        {/* Skip Option */}
        <div className="text-center">
          <button
            onClick={handleNext}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {jobs.length > 0 ? '次へ進む' : 'スキップ（後で設定）'}
          </button>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 勤務先情報は銀行取引の自動分類に使用されます。後からでも追加・編集可能です
        </p>
      </div>
    </div>
  );
}