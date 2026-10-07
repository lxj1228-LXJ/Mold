import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Tag, Alert as AntAlert, Spin } from 'antd';
import {
  ToolOutlined,
  SettingOutlined,
  AppstoreOutlined,
  WarningOutlined,
  DollarOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { dashboardApi } from '../api';
import { MOLD_STATUS_MAP, REPAIR_STATUS_MAP, URGENCY_MAP, type Alert } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.stats(), dashboardApi.alerts()]).then(([s, a]) => {
      setStats(s);
      setAlerts(a);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const errorAlerts = alerts.filter(a => a.level === 'error');
  const warnAlerts = alerts.filter(a => a.level === 'warning');

  return (
    <div>
      {(errorAlerts.length > 0 || warnAlerts.length > 0) && (
        <div style={{ marginBottom: 16 }}>
          {errorAlerts.length > 0 && (
            <AntAlert
              type="error"
              showIcon
              message={`有 ${errorAlerts.length} 项紧急预警需要处理`}
              style={{ marginBottom: 8 }}
            />
          )}
          {warnAlerts.length > 0 && (
            <AntAlert
              type="warning"
              showIcon
              message={`有 ${warnAlerts.length} 项预警提醒`}
            />
          )}
        </div>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="模具总数" value={stats.totalMolds} prefix={<ToolOutlined />} suffix="套" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="使用中" value={stats.inUseMolds} prefix={<SettingOutlined />} suffix="套" valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="待处理维修" value={stats.pendingRepairs} prefix={<AppstoreOutlined />} suffix="项" valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="库存预警" value={stats.lowStockParts} prefix={<WarningOutlined />} suffix="项" valueStyle={{ color: stats.lowStockParts > 0 ? '#ff4d4f' : '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="在用模具" value={stats.inUseMolds} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="保养中" value={stats.maintenanceMolds} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="维修中" value={stats.repairMolds} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="备件总数" value={stats.totalParts} prefix={<DatabaseOutlined />} suffix="种" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12}>
          <Card title="模具状态分布" size="small">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {(stats.statusDist as any[]).map(s => {
                const info = MOLD_STATUS_MAP[s.status] || { label: s.status, color: 'default' };
                return (
                  <div key={s.status} style={{ textAlign: 'center', minWidth: 80 }}>
                    <Tag color={info.color} style={{ fontSize: 14, padding: '4px 12px' }}>{info.label}</Tag>
                    <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{s.count}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card title="费用统计" size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="维修总费用" value={stats.totalRepairCost} precision={2} prefix={<DollarOutlined />} suffix="元" />
              </Col>
              <Col span={12}>
                <Statistic title="保养总费用" value={stats.totalMaintenanceCost} precision={2} prefix={<DollarOutlined />} suffix="元" />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="最近维修记录" size="small">
            <Table
              dataSource={stats.recentRepairs}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: '模具', dataIndex: 'mold_code', width: 80 },
                { title: '故障描述', dataIndex: 'fault_description', ellipsis: true },
                { title: '紧急度', dataIndex: 'urgency', width: 70, render: (v: string) => <Tag color={URGENCY_MAP[v]?.color}>{URGENCY_MAP[v]?.label}</Tag> },
                { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={REPAIR_STATUS_MAP[v]?.color}>{REPAIR_STATUS_MAP[v]?.label}</Tag> },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近保养记录" size="small">
            <Table
              dataSource={stats.recentMaintenance}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: '模具', dataIndex: 'mold_code', width: 80 },
                { title: '保养类型', dataIndex: 'type', width: 80 },
                { title: '日期', dataIndex: 'maintenance_date', width: 110 },
                { title: '操作人', dataIndex: 'operator', width: 80 },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
