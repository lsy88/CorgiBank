import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Typography, Progress, DatePicker, Radio, Tooltip } from 'antd';
import { 
  GoldOutlined, 
  UserOutlined, 
  ClockCircleOutlined, 
  WalletOutlined,
  LineChartOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { AppData, Batch } from '../types';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

interface Props {
  data: AppData;
  onNavigate: (key: string) => void;
}

const { Title, Text } = Typography;

export const Dashboard: React.FC<Props> = ({ data, onNavigate }) => {
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [mode, setMode] = useState<'month' | 'year'>('month');

  const dateStr = date.format(mode === 'month' ? 'YYYY-MM' : 'YYYY');

  // Filter batches for the selected period
  const currentBatches = useMemo(() => {
    return (data.batches || [])
      .filter(b => b.date.startsWith(dateStr))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.batches, dateStr]);

  // Filter losses for the selected period
  const currentLosses = useMemo(() => {
    return (data.losses || []).filter(l => l.date.startsWith(dateStr));
  }, [data.losses, dateStr]);

  // Calculations
  const calculateMetrics = (batches: Batch[], losses: any[]) => {
    let totalSalary = 0;
    let totalMaterial = 0;
    let totalQuantity = 0;
    let totalLoss = 0;

    batches.forEach(b => {
      totalSalary += (b.products || []).reduce((acc, p) => acc + (p.quantity * (p.snapshotPrice || 0)), 0);
      totalMaterial += (b.materials || []).reduce((acc, m) => acc + (m.quantity * (m.snapshotPrice || 0)), 0);
      totalQuantity += (b.products || []).reduce((acc, p) => acc + p.quantity, 0);
    });

    losses.forEach(l => {
      totalLoss += l.amount;
    });

    const totalCost = totalSalary + totalMaterial + totalLoss;
    const unitCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;

    return { totalSalary, totalMaterial, totalQuantity, totalLoss, totalCost, unitCost, count: batches.length };
  };

  const currentMetrics = calculateMetrics(currentBatches, currentLosses);

  // Calculate Trend Data (Last 6 Months)
  const trendData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      months.push(dayjs().subtract(i, 'month').format('YYYY-MM'));
    }
    
    return months.map(m => {
      const b = (data.batches || []).filter(item => item.date.startsWith(m));
      const l = (data.losses || []).filter(item => item.date.startsWith(m));
      const metrics = calculateMetrics(b, l);
      return {
        label: m.slice(5), // MM
        fullLabel: m,
        cost: metrics.totalCost,
        quantity: metrics.totalQuantity
      };
    });
  }, [data.batches, data.losses]);

  const maxCost = Math.max(...trendData.map(d => d.cost), 1);

  // Employee Rankings
  const employeeStats = useMemo(() => {
    const stats = new Map<string, number>();
    currentBatches.forEach(batch => {
      let batchValue = 0;
      (batch.products || []).forEach(p => batchValue += (p.quantity * (p.snapshotPrice || 0)));

      let totalShare = 0;
      (batch.employees || []).forEach(e => totalShare += (e.share || 1));

      if (totalShare > 0) {
        (batch.employees || []).forEach(e => {
          const ratio = (e.share || 1) / totalShare;
          stats.set(e.employeeId, (stats.get(e.employeeId) || 0) + (batchValue * ratio));
        });
      }
    });

    return Array.from(stats.entries())
      .map(([id, val]) => ({
        id,
        name: data.employees.find(e => e.id === id)?.name || '未知员工',
        value: val
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [currentBatches, data.employees]);

  const maxSalary = employeeStats.length > 0 ? employeeStats[0].value : 100;

  return (
    <div style={{ padding: '0 12px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>经营概览</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>全面掌握生产经营数据与成本结构</Text>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Radio.Group value={mode} onChange={e => setMode(e.target.value)} size="small">
            <Radio.Button value="month">月度</Radio.Button>
            <Radio.Button value="year">年度</Radio.Button>
          </Radio.Group>
          <DatePicker 
            picker={mode} 
            value={date} 
            onChange={(val) => val && setDate(val)} 
            allowClear={false} 
            size="small"
          />
        </div>
      </div>

      {/* Core Metrics */}
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card variant="borderless" style={{ height: '100%' }}>
            <Statistic
              title={
                <Tooltip title="本期总支出 = 工资 + 原料 + 损耗">
                  总生产成本 <InfoCircleOutlined style={{ fontSize: 12 }} />
                </Tooltip>
              }
              value={currentMetrics.totalCost}
              precision={2}
              prefix={<WalletOutlined />}
              suffix="元"
              styles={{ content: { color: '#cf1322', fontWeight: 'bold' } }}
            />
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>工资 ({(currentMetrics.totalSalary / (currentMetrics.totalCost || 1) * 100).toFixed(0)}%)</span>
                <span>¥{currentMetrics.totalSalary.toFixed(0)}</span>
              </div>
              <Progress percent={(currentMetrics.totalSalary / (currentMetrics.totalCost || 1) * 100)} showInfo={false} strokeColor="#1890ff" size="small" />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, marginTop: 8 }}>
                <span>原料 ({(currentMetrics.totalMaterial / (currentMetrics.totalCost || 1) * 100).toFixed(0)}%)</span>
                <span>¥{currentMetrics.totalMaterial.toFixed(0)}</span>
              </div>
              <Progress percent={(currentMetrics.totalMaterial / (currentMetrics.totalCost || 1) * 100)} showInfo={false} strokeColor="#faad14" size="small" />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, marginTop: 8 }}>
                <span>损耗 ({(currentMetrics.totalLoss / (currentMetrics.totalCost || 1) * 100).toFixed(0)}%)</span>
                <span>¥{currentMetrics.totalLoss.toFixed(0)}</span>
              </div>
              <Progress percent={(currentMetrics.totalLoss / (currentMetrics.totalCost || 1) * 100)} showInfo={false} strokeColor="#ff4d4f" size="small" />
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card variant="borderless" style={{ height: '100%' }}>
            <Statistic
              title="生产总件数"
              value={currentMetrics.totalQuantity}
              precision={0}
              prefix={<GoldOutlined />}
              suffix="件"
              styles={{ content: { color: '#3f8600', fontWeight: 'bold' } }}
            />
            <div style={{ marginTop: 24 }}>
               <Text type="secondary" style={{ fontSize: 12 }}>单件综合成本</Text>
               <div style={{ fontSize: 24, fontWeight: 'bold', color: '#595959' }}>
                 ¥{currentMetrics.unitCost.toFixed(2)}
                 <span style={{ fontSize: 12, fontWeight: 'normal', color: '#999', marginLeft: 4 }}>/ 件</span>
               </div>
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: '#888' }}>
              共生产 {currentMetrics.count} 个批次
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card title={<div style={{ fontSize: 14 }}><LineChartOutlined /> 近6个月成本趋势</div>} variant="borderless" style={{ height: '100%' }} styles={{ body: { paddingTop: 12, paddingBottom: 12 } }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 140, gap: 8 }}>
              {trendData.map(d => (
                <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Tooltip title={`${d.fullLabel}: ¥${d.cost.toFixed(0)}`}>
                    <div 
                      style={{ 
                        height: `${Math.max((d.cost / maxCost) * 100, 2)}%`, 
                        background: d.fullLabel === dateStr ? '#1890ff' : '#f0f0f0', 
                        width: '60%',
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.3s'
                      }} 
                    />
                  </Tooltip>
                  <span style={{ fontSize: 10, marginTop: 4, color: '#999' }}>{d.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card 
            title={<div style={{ fontSize: 14 }}><ClockCircleOutlined /> 最近生产批次</div>} 
            variant="borderless" 
            extra={<a onClick={() => onNavigate('batches')}>查看全部</a>}
            styles={{ body: { padding: '0 12px' } }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {currentBatches.slice(0, 5).map((item, index) => (
                <div key={item.id || index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 0',
                  borderBottom: index < 4 ? '1px solid #f0f0f0' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 40, height: 40, background: '#e6f7ff', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ClockCircleOutlined style={{ color: '#1890ff' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.name}</div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                        <span>{item.date}</span>
                        <span>{item.products?.length || 0} 种产品</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold' }}>
                      ¥{((item.products || []).reduce((acc, p) => acc + (p.quantity * (p.snapshotPrice || 0)), 0)).toFixed(2)}
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>人工支出</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col span={10}>
          <Card 
            title={<div style={{ fontSize: 14 }}><UserOutlined /> 员工薪资 Top 5</div>} 
            variant="borderless" 
            extra={<a onClick={() => onNavigate('reports')}>完整报表</a>}
            styles={{ body: { padding: '12px 24px' } }}
          >
            {employeeStats.length === 0 ? <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无数据</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {employeeStats.map((emp, index) => (
                  <div key={emp.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>
                        <span style={{ 
                          display: 'inline-block', 
                          width: 20, 
                          height: 20, 
                          borderRadius: '50%', 
                          background: index < 3 ? '#ffec3d' : '#f0f0f0', 
                          color: index < 3 ? '#d48806' : '#666',
                          textAlign: 'center',
                          lineHeight: '20px',
                          marginRight: 8,
                          fontSize: 12,
                          fontWeight: 'bold'
                        }}>{index + 1}</span>
                        {emp.name}
                      </span>
                      <span>¥{emp.value.toFixed(2)}</span>
                    </div>
                    <Progress 
                      percent={(emp.value / maxSalary) * 100} 
                      showInfo={false} 
                      strokeColor={index === 0 ? '#cf1322' : index === 1 ? '#fa541c' : '#faad14'} 
                      size="small"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
