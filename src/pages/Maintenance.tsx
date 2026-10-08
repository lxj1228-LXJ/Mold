import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Tabs, Tag, Space, message, Popconfirm, Card } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { maintenanceApi, moldApi } from '../api';
import { MAINTENANCE_TYPE_MAP, type MaintenancePlan, type MaintenanceRecord, type Mold } from '../types';
import dayjs from 'dayjs';

const typeOptions = Object.entries(MAINTENANCE_TYPE_MAP).map(([k, v]) => ({ value: k, label: v }));

export default function Maintenance() {
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [molds, setMolds] = useState<Mold[]>([]);
  const [planTotal, setPlanTotal] = useState(0);
  const [recordTotal, setRecordTotal] = useState(0);
  const [planLoading, setPlanLoading] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [planParams, setPlanParams] = useState({ page: 1, pageSize: 10 });
  const [recordParams, setRecordParams] = useState({ page: 1, pageSize: 10 });
  const [planModal, setPlanModal] = useState(false);
  const [recordModal, setRecordModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MaintenancePlan | null>(null);
  const [planForm] = Form.useForm();
  const [recordForm] = Form.useForm();

  useEffect(() => {
    moldApi.list({ pageSize: 1000 }).then(r => setMolds(r.list));
  }, []);

  const fetchPlans = async () => {
    setPlanLoading(true);
    try {
      const res = await maintenanceApi.listPlans(planParams);
      setPlans(res.list);
      setPlanTotal(res.total);
    } finally { setPlanLoading(false); }
  };

  const fetchRecords = async () => {
    setRecordLoading(true);
    try {
      const res = await maintenanceApi.listRecords(recordParams);
      setRecords(res.list);
      setRecordTotal(res.total);
    } finally { setRecordLoading(false); }
  };

  useEffect(() => { fetchPlans(); }, [planParams]);
  useEffect(() => { fetchRecords(); }, [recordParams]);

  const handleAddPlan = () => { setEditingPlan(null); planForm.resetFields(); setPlanModal(true); };
  const handleEditPlan = (r: MaintenancePlan) => {
    setEditingPlan(r);
    planForm.setFieldsValue({
      ...r,
      last_date: r.last_date ? dayjs(r.last_date) : null,
      next_date: r.next_date ? dayjs(r.next_date) : null,
    });
    setPlanModal(true);
  };

  const handleSavePlan = async () => {
    const values = await planForm.validateFields();
    const payload = {
      ...values,
      last_date: values.last_date?.format('YYYY-MM-DD') || null,
      next_date: values.next_date?.format('YYYY-MM-DD') || null,
    };
    if (editingPlan) {
      await maintenanceApi.updatePlan(editingPlan.id, payload);
      message.success('更新成功');
    } else {
      await maintenanceApi.createPlan(payload);
      message.success('创建成功');
    }
    setPlanModal(false);
    fetchPlans();
  };

  const handleSaveRecord = async () => {
    const values = await recordForm.validateFields();
    const payload = {
      ...values,
      maintenance_date: values.maintenance_date?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
      next_date: values.next_date?.format('YYYY-MM-DD') || null,
    };
    await maintenanceApi.createRecord(payload);
    message.success('记录成功');
    setRecordModal(false);
    recordForm.resetFields();
    fetchRecords();
    fetchPlans();
  };

  const today = dayjs().format('YYYY-MM-DD');

  const planColumns = [
    { title: '模具编号', dataIndex: 'mold_code', width: 100 },
    { title: '模具名称', dataIndex: 'mold_name', width: 150, ellipsis: true },
    { title: '保养类型', dataIndex: 'type', width: 100, render: (v: string) => MAINTENANCE_TYPE_MAP[v] || v },
    { title: '周期(天)', dataIndex: 'cycle_days', width: 80 },
    { title: '上次保养', dataIndex: 'last_date', width: 110 },
    {
      title: '下次保养', dataIndex: 'next_date', width: 110,
      render: (v: string) => {
        if (!v) return '-';
        const isOverdue = v < today;
        const isSoon = !isOverdue && v <= dayjs().add(7, 'day').format('YYYY-MM-DD');
        return <Tag color={isOverdue ? 'error' : isSoon ? 'warning' : 'success'}>{v}</Tag>;
      },
    },
    { title: '负责人', dataIndex: 'responsible', width: 80 },
    { title: '保养内容', dataIndex: 'content', ellipsis: true },
    {
      title: '操作', width: 150, fixed: 'right' as const,
      render: (_: any, r: MaintenancePlan) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEditPlan(r)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => maintenanceApi.deletePlan(r.id).then(() => { message.success('已删除'); fetchPlans(); })}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const recordColumns = [
    { title: '模具编号', dataIndex: 'mold_code', width: 100 },
    { title: '模具名称', dataIndex: 'mold_name', width: 150, ellipsis: true },
    { title: '保养日期', dataIndex: 'maintenance_date', width: 110 },
    { title: '类型', dataIndex: 'type', width: 100, render: (v: string) => MAINTENANCE_TYPE_MAP[v] || v },
    { title: '操作人', dataIndex: 'operator', width: 80 },
    { title: '结果', dataIndex: 'result', width: 100, ellipsis: true },
    { title: '费用', dataIndex: 'cost', width: 80, render: (v: number) => `¥${v?.toFixed(2)}` },
    { title: '内容', dataIndex: 'content', ellipsis: true },
  ];

  const moldOptions = molds.map(m => ({ value: m.id, label: `${m.code} - ${m.name}` }));

  return (
    <div className="fade-in">
      <Card className="page-card">
        <Tabs
          defaultActiveKey="plans"
          items={[
            {
              key: 'plans',
              label: '保养计划',
              children: (
                <>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <Space>
                      <Button icon={<ReloadOutlined />} onClick={fetchPlans}>刷新</Button>
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPlan}>新增计划</Button>
                    </Space>
                  </div>
                  <Table
                    dataSource={plans}
                    columns={planColumns}
                    rowKey="id"
                    loading={planLoading}
                    scroll={{ x: 1100 }}
                    pagination={{
                      current: planParams.page, pageSize: planParams.pageSize, total: planTotal,
                      showTotal: t => `共 ${t} 条`,
                      onChange: (page, pageSize) => setPlanParams(p => ({ ...p, page, pageSize })),
                    }}
                  />
                </>
              ),
            },
            {
              key: 'records',
              label: '保养记录',
              children: (
                <>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <Space>
                      <Button icon={<ReloadOutlined />} onClick={fetchRecords}>刷新</Button>
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => { recordForm.resetFields(); setRecordModal(true); }}>新增记录</Button>
                    </Space>
                  </div>
                  <Table
                    dataSource={records}
                    columns={recordColumns}
                    rowKey="id"
                    loading={recordLoading}
                    scroll={{ x: 1000 }}
                    pagination={{
                      current: recordParams.page, pageSize: recordParams.pageSize, total: recordTotal,
                      showTotal: t => `共 ${t} 条`,
                      onChange: (page, pageSize) => setRecordParams(p => ({ ...p, page, pageSize })),
                    }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editingPlan ? '编辑保养计划' : '新增保养计划'}
        open={planModal}
        onOk={handleSavePlan}
        onCancel={() => setPlanModal(false)}
        okText="保存"
        cancelText="取消"
        width={520}
      >
        <Form form={planForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="mold_id" label="模具" rules={[{ required: true, message: '请选择模具' }]}>
            <Select placeholder="选择模具" options={moldOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="type" label="保养类型" rules={[{ required: true, message: '请选择类型' }]}>
              <Select placeholder="选择类型" options={typeOptions} />
            </Form.Item>
            <Form.Item name="cycle_days" label="周期(天)">
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
            <Form.Item name="last_date" label="上次保养日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="next_date" label="下次保养日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="responsible" label="负责人">
            <Input placeholder="负责人姓名" />
          </Form.Item>
          <Form.Item name="content" label="保养内容">
            <Input.TextArea rows={3} placeholder="保养内容描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增保养记录"
        open={recordModal}
        onOk={handleSaveRecord}
        onCancel={() => setRecordModal(false)}
        okText="保存"
        cancelText="取消"
        width={520}
      >
        <Form form={recordForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="mold_id" label="模具" rules={[{ required: true, message: '请选择模具' }]}>
            <Select placeholder="选择模具" options={moldOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="maintenance_date" label="保养日期" initialValue={dayjs()}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="type" label="保养类型" rules={[{ required: true }]}>
              <Select placeholder="选择类型" options={typeOptions} />
            </Form.Item>
            <Form.Item name="operator" label="操作人">
              <Input placeholder="操作人姓名" />
            </Form.Item>
            <Form.Item name="cost" label="费用(元)">
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </div>
          <Form.Item name="result" label="保养结果">
            <Input placeholder="如：正常" />
          </Form.Item>
          <Form.Item name="content" label="保养内容">
            <Input.TextArea rows={3} placeholder="保养内容描述" />
          </Form.Item>
          <Form.Item name="next_date" label="下次保养日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
