'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, DollarSign, Save, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatYen } from '@/lib/tax-walls';

interface ManualIncome {
  id?: string;
  amount: number;
  paid_on: string;
  taxable: boolean;
  description: string;
  category: string;
}

interface Props {
  isVisible: boolean; // Show only if user has multi_pay or other_income enabled
  userId: string;
}

export default function ManualIncomeCard({ isVisible, userId }: Props) {
  const [incomes, setIncomes] = useState<ManualIncome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ManualIncome>>({
    amount: 0,
    paid_on: new Date().toISOString().split('T')[0],
    taxable: true,
    description: '',
    category: 'other'
  });

  const supabase = createClient();

  useEffect(() => {
    if (isVisible) {
      fetchIncomes();
    }
  }, [isVisible, userId]);

  const fetchIncomes = async () => {
    try {
      const { data, error } = await supabase
        .from('manual_incomes')
        .select('*')
        .eq('user_id', userId)
        .order('paid_on', { ascending: false });

      if (error) throw error;
      setIncomes(data || []);
    } catch (error) {
      console.error('Error fetching manual incomes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      const incomeData = {
        ...formData,
        user_id: userId,
        amount: Number(formData.amount),
      };

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('manual_incomes')
          .update(incomeData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('manual_incomes')
          .insert(incomeData);

        if (error) throw error;
      }

      // Reset form and refresh data
      setFormData({
        amount: 0,
        paid_on: new Date().toISOString().split('T')[0],
        taxable: true,
        description: '',
        category: 'other'
      });
      setIsAdding(false);
      setEditingId(null);
      await fetchIncomes();

    } catch (error) {
      console.error('Error saving manual income:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (income: ManualIncome) => {
    setFormData({
      amount: income.amount,
      paid_on: income.paid_on,
      taxable: income.taxable,
      description: income.description,
      category: income.category
    });
    setEditingId(income.id || null);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この収入記録を削除しますか？')) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('manual_incomes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchIncomes();
    } catch (error) {
      console.error('Error deleting manual income:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      amount: 0,
      paid_on: new Date().toISOString().split('T')[0],
      taxable: true,
      description: '',
      category: 'other'
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const getTotalTaxableIncome = () => {
    return incomes
      .filter(income => income.taxable)
      .reduce((total, income) => total + income.amount, 0);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">手動収入入力</h3>
          <p className="text-sm text-gray-600">
            現金給与や副業収入など、自動追跡できない収入を記録
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          disabled={isAdding || isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          追加
        </button>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-700">今年の手動入力収入（課税対象）</span>
          <span className="text-lg font-semibold text-blue-900">
            {formatYen(getTotalTaxableIncome())}
          </span>
        </div>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-4">
            {editingId ? '収入を編集' : '新しい収入を追加'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                金額（円）
              </label>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 50000"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                支払日
              </label>
              <input
                type="date"
                value={formData.paid_on || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, paid_on: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: A社 現金給与"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ
              </label>
              <select
                value={formData.category || 'other'}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="salary">給与</option>
                <option value="freelance">フリーランス</option>
                <option value="cash_job">現金払いバイト</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.taxable || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxable: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">課税対象</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={isLoading || !formData.amount || !formData.description}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {editingId ? '更新' : '保存'}
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Income List */}
      <div className="space-y-3">
        {isLoading && incomes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">読み込み中...</div>
        ) : incomes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            まだ手動入力された収入はありません
          </div>
        ) : (
          incomes.map((income) => (
            <div
              key={income.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {formatYen(income.amount)}
                    </span>
                    {income.taxable ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        課税
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        非課税
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-700 mb-1">{income.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(income.paid_on).toLocaleDateString('ja-JP')}
                    </div>
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {getCategoryName(income.category)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(income)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(income.id!)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getCategoryName(category: string): string {
  const categoryNames: Record<string, string> = {
    salary: '給与',
    freelance: 'フリーランス',
    cash_job: '現金払いバイト',
    other: 'その他'
  };
  return categoryNames[category] || category;
}