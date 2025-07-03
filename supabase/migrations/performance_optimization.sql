-- =====================================================
-- 扶養わかるんです - パフォーマンス最適化マイグレーション
-- =====================================================

-- ダッシュボード向けインデックス最適化
-- 複合インデックスでクエリパフォーマンスを向上

-- 1. user_profile テーブルの最適化
-- ユーザー別の高速アクセス用インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profile_user_id_active 
ON user_profile(user_id) 
WHERE user_id IS NOT NULL;

-- 扶養線別の統計用インデックス（将来のアナリティクス用）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profile_fuyou_line 
ON user_profile(fuyou_line, is_student) 
WHERE fuyou_line > 0;

-- 2. user_stats テーブルの最適化
-- ダッシュボード表示用の最適化（最も頻繁にアクセスされるクエリ）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_dashboard 
ON user_stats(user_id, updated_at DESC) 
WHERE user_id IS NOT NULL;

-- 年次収入での検索最適化
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_ytd_income 
ON user_stats(user_id, ytd_income) 
WHERE ytd_income >= 0;

-- 最終計算日での並び替え最適化
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_last_calculated 
ON user_stats(user_id, last_calculated DESC);

-- 3. user_moneytree_tokens テーブルの最適化
-- 銀行連携状況確認用
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moneytree_tokens_user_active 
ON user_moneytree_tokens(user_id, created_at DESC) 
WHERE access_token IS NOT NULL;

-- 同期状況確認用
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moneytree_tokens_sync_status 
ON user_moneytree_tokens(user_id, last_synced DESC) 
WHERE last_synced IS NOT NULL;

-- 4. transactions テーブルの最適化（存在する場合）
-- 年別取引データの高速検索
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_year 
ON transactions(user_id, EXTRACT(YEAR FROM date)) 
WHERE user_id IS NOT NULL AND date IS NOT NULL;

-- 金額範囲での検索最適化
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_amount 
ON transactions(user_id, amount, date DESC) 
WHERE user_id IS NOT NULL AND amount > 0;

-- 5. パフォーマンス統計用ビューの作成
-- ダッシュボードバッチAPI用の最適化ビュー
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT 
  up.user_id,
  up.fuyou_line,
  up.hourly_wage,
  up.is_student,
  us.ytd_income,
  us.transaction_count,
  us.last_calculated,
  us.updated_at as stats_updated_at,
  CASE 
    WHEN mt.user_id IS NOT NULL THEN true 
    ELSE false 
  END as bank_connected,
  mt.last_synced as bank_last_synced,
  mt.created_at as bank_connected_at
FROM user_profile up
LEFT JOIN user_stats us ON up.user_id = us.user_id
LEFT JOIN user_moneytree_tokens mt ON up.user_id = mt.user_id
WHERE up.user_id IS NOT NULL;

-- ビュー用インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dashboard_summary_user 
ON user_profile(user_id);

-- 6. クエリ統計の有効化（統計情報の更新）
-- PostgreSQLの統計情報を更新してクエリプランナーを最適化
ANALYZE user_profile;
ANALYZE user_stats;
ANALYZE user_moneytree_tokens;

-- 7. パフォーマンス監視用関数
-- インデックス使用状況を監視する関数
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE(
  table_name text,
  index_name text,
  index_scans bigint,
  rows_read bigint,
  rows_fetched bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    indexrelname as index_name,
    idx_scan as index_scans,
    idx_tup_read as rows_read,
    idx_tup_fetch as rows_fetched
  FROM pg_stat_user_indexes 
  WHERE schemaname = 'public'
  ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. 自動バキューム設定の最適化
-- 頻繁に更新されるテーブルの自動バキューム設定
ALTER TABLE user_stats SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE user_moneytree_tokens SET (
  autovacuum_vacuum_scale_factor = 0.2,
  autovacuum_analyze_scale_factor = 0.1
);

-- =====================================================
-- パフォーマンステスト用クエリ
-- =====================================================

-- テストクエリ 1: ダッシュボードバッチデータ取得
-- EXPLAIN ANALYZE 
-- SELECT * FROM dashboard_summary WHERE user_id = 'test-user-id';

-- テストクエリ 2: 年次収入統計
-- EXPLAIN ANALYZE 
-- SELECT user_id, ytd_income, last_calculated 
-- FROM user_stats 
-- WHERE user_id = 'test-user-id' 
-- ORDER BY last_calculated DESC 
-- LIMIT 1;

-- テストクエリ 3: 銀行連携状況
-- EXPLAIN ANALYZE 
-- SELECT user_id, last_synced 
-- FROM user_moneytree_tokens 
-- WHERE user_id = 'test-user-id';

-- =====================================================
-- インデックス作成完了確認
-- =====================================================

-- 作成されたインデックスの確認
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- インデックスサイズの確認
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexname::regclass) DESC;