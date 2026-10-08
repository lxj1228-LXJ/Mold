import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Tag, Space, message, Popconfirm, Card } from 'antd';
import { PlusOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { repairApi, moldApi } from '../api';
import { REPAIR_STATUS_MAP, URGENCY_MAP, type Repair, type Mold } from '../types';
import dayjs from 'dayjs';

const statusOptions = Object.entries(REPAIR_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }));
const urgencyOptions = Object.entries(URGENCY_MAP).map(([k, v]) => ({ value: k, label: v.label }));
const faultTypeOptions = ['型腔损伤', '顶出故障', '冷却系统', '加热系统', '导向系统', '电气故障', '其他'].map(t => ({ value: t, label: t }));

export default function Repairs() {
  const [data, setData] = useState<Repair[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({ page: 1, pageSize: 10, keyword: '', status: '', urgency: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<Repair | null>(null);
  const [detail, setDetail] = useState<Repair | null>(null);
  const [form] = Form.useForm();
  const [molds, setMolds] = useState<Mold[]>([]);

  useEffect(() => { moldApi.list({ pageSize: 1000 }).then(r => setMolds(r.list)); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await repairApi.list(params);
      setData(res.list);
      setTotal(res.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [params]);

  const handleAdd = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ report_date: dayjs(), urgency: 'normal', status: 'pending' }); setModalOpen(true); };
  const handleEdit = (r: Repair) => {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      report_date: r.report_date ? dayjs(r.report_date) : null,
      repair_date: r.repair_date ? dayjs(r.repair_date) : null,
      completion_date: r.completion_date ? dayjs(r.completion_date) : null,
    });
    setModalOpen(true);
  };

  const handleView = async (r: Repair) => {
    const d = await repairApi.get(r.id);
    setDetail(d);
    setDetailOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      report_date: values.report_date?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
      repair_date: values.repair_date?.format('YYYY-MM-DD') || null,
      completion_date: values.completion_date?.format('YYYY-MM-DD') || null,
    };
    if (editing) {
      await repairApi.update(editing.id, payload);
      message.success('更新成功');
    } else {
      await repairApi.create(payload);
      message.success('创建成功');
    }
    setModalOpen(false);
    fetchData();
  };

  const columns = [
    { title: '模具编号', dataIndex: 'mold_code', width: 100 },
    { title: '模具名称', dataIndex: 'mold_name', width: 140, ellipsis: true },
    { title: '报修日期', dataIndex: 'report_date', width: 110 },
    { title: '故障描述', dataIndex: 'fault_description', ellipsis: true },
    { title: '故障类型', dataIndex: 'fault_type', width: 100 },
    { title: '紧急度', dataIndex: 'urgency', width: 80, render: (v: string) => <Tag color={URGENCY_MAP[v]?.color}>{URGENCY_MAP[v]?.label}</Tag> },
    { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => <Tag color={REPAIR_STATUS_MAP[v]?.color}>{REPAIR_STATUS_MAP[v]?.label}</Tag> },
    { title: '维修人', dataIndex: 'repair_person', width: 80 },
    { title: '费用', dataIndex: 'cost', width: 90, render: (v: number) => v ? `¥${v.toFixed(2)}` : '-' },
    {
      title: '操作', width: 180, fixed: 'right' as const,
      render: (_: any, r: Repair) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(r)}>详情</Button>
          <Button type="link" size="small" onClick={() => handleEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => repairApi.delete(r.id).then(() => { message.success('已删除'); fetchData(); })}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const moldOptions = molds.map(m => ({ value: m.id, label: `${m.code} - ${m.name}` }));

  return (
    <div className="fade-in">
      <div className="search-bar" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space wrap>
          <Input placeholder="搜索模具/故障" value={params.keyword} onChange={e => setParams(p => ({ ...p, keyword: e.target.value }))} style={{ width: 200 }} allowClear />
          <Select placeholder="状态" value={params.status || undefined} onChange={v => setParams(p => ({ ...p, status: v || '' }))} options={statusOptions} style={{ width: 120 }} allowClear />
          <Select placeholder="紧急度" value={params.urgency || undefined} onChange={v => setParams(p => ({ ...p, urgency: v || '' }))} options={urgencyOptions} style={{ width: 120 }} allowClear />
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增报修</Button>
        </Space>
      </div>

      <Card className="page-card">
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          current: params.page, pageSize: params.pageSize, total,
          showTotal: t => `共 ${t} 条`,
          onChange: (page, pageSize) => setParams(p => ({ ...p, page, pageSize })),
        }}
      />
      </Card>

      <Modal
        title={editing ? '编辑维修记录' : '新增报修'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="mold_id" label="模具" rules={[{ required: true, message: '请选择模具' }]}>
            <Select placeholder="选择模具" options={moldOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="report_date" label="报修日期" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="urgency" label="紧急度">
              <Select options={urgencyOptions} />
            </Form.Item>
            <Form.Item name="fault_type" label="故障类型">
              <Select placeholder="选择故障类型" options={faultTypeOptions} allowClear />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select options={statusOptions} />
            </Form.Item>
            <Form.Item name="repair_person" label="维修人员">
              <Input placeholder="维修人员姓名" />
            </Form.Item>
            <Form.Item name="cost" label="维修费用(元)">
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            <Form.Item name="repair_date" label="维修日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="completion_date" label="完成日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="fault_description" label="故障描述">
            <Input.TextArea rows={2} placeholder="描述故障情况" />
          </Form.Item>
          <Form.Item name="repair_content" label="维修内容">
            <Input.TextArea rows={2} placeholder="维修内容描述" />
          </Form.Item>
          <Form.Item name="result" label="维修结果">
            <Input placeholder="维修结果" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="维修详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={600}
      >
        {detail && (
          <div style={{ lineHeight: 2.2 }}>
            <p><strong>模具：</strong>{detail.mold_code} - {detail.mold_name}</p>
            <p><strong>报修日期：</strong>{detail.report_date}</p>
            <p><strong>故障类型：</strong>{detail.fault_type || '-'}</p>
            <p><strong>故障描述：</strong>{detail.fault_description || '-'}</p>
            <p><strong>紧急度：</strong><Tag color={URGENCY_MAP[detail.urgency]?.color}>{URGENCY_MAP[detail.urgency]?.label}</Tag></p>
            <p><strong>状态：</strong><Tag color={REPAIR_STATUS_MAP[detail.status]?.color}>{REPAIR_STATUS_MAP[detail.status]?.label}</Tag></p>
            <p><strong>维修人员：</strong>{detail.repair_person || '-'}</p>
            <p><strong>维修日期：</strong>{detail.repair_date || '-'}</p>
            <p><strong>维修内容：</strong>{detail.repair_content || '-'}</p>
            <p><strong>维修结果：</strong>{detail.result || '-'}</p>
            <p><strong>费用：</strong>{detail.cost ? `¥${detail.cost.toFixed(2)}` : '-'}</p>
            {detail.parts_usage && detail.parts_usage.length > 0 && (
              <>
                <p><strong>使用备件：</strong></p>
                <Table
                  dataSource={detail.parts_usage}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '编号', dataIndex: 'part_code' },
                    { title: '名称', dataIndex: 'part_name' },
                    { title: '数量', dataIndex: 'quantity' },
                    { title: '单位', dataIndex: 'unit' },
                  ]}
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
