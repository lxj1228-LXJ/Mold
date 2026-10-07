import { useEffect, useState } from 'react';
import { Card, Table, Tag, Tabs, Alert, Empty, Spin, Badge } from 'antd';
import {
  WarningOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { dashboardApi } from '../api';
import { MAINTENANCE_TYPE_MAP, type Alert as AlertType } from '../types';
import dayjs from 'dayjs';

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.alerts().then(data => {
      setAlerts(data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const overdueMaintenance = alerts.filter(a => a.type === 'maintenance_overdue');
  const upcomingMaintenance = alerts.filter(a => a.type === 'maintenance_upcoming');
  const lowStock = alerts.filter(a => a.type === 'low_stock');
  const overdueRepairs = alerts.filter(a => a.type === 'repair_overdue');

  const totalErrors = alerts.filter(a => a.level === 'error').length;
  const totalWarnings = alerts.filter(a => a.level === 'warning').length;

  const maintenanceColumns = [
    { title: '模具编号', dataIndex: 'mold_code', width: 100 },
    { title: '模具名称', dataIndex: 'mold_name', width: 150 },
    { title: '保养类型', dataIndex: 'type', width: 100, render: (v: string) => MAINTENANCE_TYPE_MAP[v] || v },
    { title: '计划日期', dataIndex: 'next_date', width: 120 },
    { title: '负责人', dataIndex: 'responsible', width: 80 },
    {
      title: '逾期天数', width: 100,
      render: (_: any, r: any) => {
        const days = dayjs().diff(dayjs(r.next_date), 'day');
        return <Tag color="error">{days} 天</Tag>;
      },
    },
    { title: '预警', render: () => <Tag color="error" icon={<ExclamationCircleOutlined />}>已逾期</Tag> },
  ];

  const upcomingColumns = [
    { title: '模具编号', dataIndex: 'mold_code', width: 100 },
    { title: '模具名称', dataIndex: 'mold_name', width: 150 },
    { title: '保养类型', dataIndex: 'type', width: 100, render: (v: string) => MAINTENANCE_TYPE_MAP[v] || v },
    { title: '计划日期', dataIndex: 'next_date', width: 120 },
    { title: '负责人', dataIndex: 'responsible', width: 80 },
    {
      title: '剩余天数', width: 100,
      render: (_: any, r: any) => {
        const days = dayjs(r.next_date).diff(dayjs(), 'day');
        return <Tag color={days <= 3 ? 'orange' : 'blue'}>{days} 天</Tag>;
      },
    },
    { title: '预警', render: () => <Tag color="warning" icon={<ClockCircleOutlined />}>即将到期</Tag> },
  ];

  const stockColumns = [
    { title: '备件编号', dataIndex: 'code', width: 100 },
    { title: '备件名称', dataIndex: 'name', width: 150 },
    { title: '规格', dataIndex: 'spec', width: 140 },
    { title: '分类', dataIndex: 'category', width: 100 },
    {
      title: '当前库存', dataIndex: 'stock', width: 100,
      render: (v: number) => <span style={{ color: v === 0 ? '#ff4d4f' : '#faad14', fontWeight: 700 }}>{v}</span>,
    },
    { title: '最低库存', dataIndex: 'min_stock', width: 100 },
    {
      title: '需补充', width: 100,
      render: (_: any, r: any) => {
        const need = r.min_stock - r.stock;
        return <Tag color={r.stock === 0 ? 'error' : 'warning'}>{need > 0 ? need : 0}</Tag>;
      },
    },
    {
      title: '状态', width: 100,
      render: (_: any, r: any) => r.stock === 0
        ? <Tag color="error" icon={<ExclamationCircleOutlined />}>缺货</Tag>
        : <Tag color="warning" icon={<WarningOutlined />}>库存不足</Tag>,
    },
  ];

  const repairColumns = [
    { title: '模具编号', dataIndex: 'mold_code', width: 100 },
    { title: '模具名称', dataIndex: 'mold_name', width: 150 },
    { title: '报修日期', dataIndex: 'report_date', width: 120 },
    { title: '故障描述', dataIndex: 'fault_description', ellipsis: true },
    {
      title: '超期天数', width: 100,
      render: (_: any, r: any) => {
        const days = dayjs().diff(dayjs(r.report_date), 'day');
        return <Tag color="warning">{days} 天</Tag>;
      },
    },
    { title: '预警', render: () => <Tag color="warning" icon={<ToolOutlined />}>维修超期</Tag> },
  ];

  return (
    <div>
      {(totalErrors > 0 || totalWarnings > 0) && (
        <div style={{ marginBottom: 16 }}>
          {totalErrors > 0 && (
            <Alert type="error" showIcon message={`${totalErrors} 项紧急预警`} description="存在逾期未处理的保养或库存缺货，请立即处理。" style={{ marginBottom: 8 }} />
          )}
          {totalWarnings > 0 && (
            <Alert type="warning" showIcon message={`${totalWarnings} 项预警提醒`} description="存在即将到期的保养计划或库存不足，请关注。" />
          )}
        </div>
      )}

      {alerts.length === 0 && (
        <Card>
          <Empty description="暂无预警信息，一切正常！" />
        </Card>
      )}

      {alerts.length > 0 && (
        <Card>
          <Tabs
            defaultActiveKey="overdue"
            items={[
              {
                key: 'overdue',
                label: <span><Badge count={overdueMaintenance.length} offset={[8, -2]}><ExclamationCircleOutlined /> 保养逾期</Badge></span>,
                children: overdueMaintenance.length > 0
                  ? <Table dataSource={overdueMaintenance} columns={maintenanceColumns} rowKey="id" pagination={false} size="middle" />
                  : <Empty description="暂无逾期保养" />,
              },
              {
                key: 'upcoming',
                label: <span><Badge count={upcomingMaintenance.length} offset={[8, -2]}><ClockCircleOutlined /> 即将到期</Badge></span>,
                children: upcomingMaintenance.length > 0
                  ? <Table dataSource={upcomingMaintenance} columns={upcomingColumns} rowKey="id" pagination={false} size="middle" />
                  : <Empty description="暂无即将到期的保养" />,
              },
              {
                key: 'stock',
                label: <span><Badge count={lowStock.length} offset={[8, -2]}><WarningOutlined /> 库存预警</Badge></span>,
                children: lowStock.length > 0
                  ? <Table dataSource={lowStock} columns={stockColumns} rowKey="id" pagination={false} size="middle" />
                  : <Empty description="暂无库存预警" />,
              },
              {
                key: 'repair',
                label: <span><Badge count={overdueRepairs.length} offset={[8, -2]}><ToolOutlined /> 维修超期</Badge></span>,
                children: overdueRepairs.length > 0
                  ? <Table dataSource={overdueRepairs} columns={repairColumns} rowKey="id" pagination={false} size="middle" />
                  : <Empty description="暂无超期维修" />,
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
