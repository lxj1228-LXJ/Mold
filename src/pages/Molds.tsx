import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Tag, Space, message, Popconfirm, Card, Progress } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { moldApi } from '../api';
import { MOLD_STATUS_MAP, type Mold } from '../types';
import dayjs from 'dayjs';

const statusOptions = Object.entries(MOLD_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }));
const categoryOptions = ['注塑模', '冲压模', '压铸模', '锻造模', '挤出模'].map(c => ({ value: c, label: c }));

export default function Molds() {
  const [data, setData] = useState<Mold[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({ page: 1, pageSize: 10, keyword: '', status: '', category: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Mold | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await moldApi.list(params);
      setData(res.list);
      setTotal(res.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [params]);

  const handleAdd = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const handleEdit = (record: Mold) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      purchase_date: record.purchase_date ? dayjs(record.purchase_date) : null,
      warranty_date: record.warranty_date ? dayjs(record.warranty_date) : null,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      purchase_date: values.purchase_date?.format('YYYY-MM-DD') || null,
      warranty_date: values.warranty_date?.format('YYYY-MM-DD') || null,
    };
    if (editing) {
      await moldApi.update(editing.id, payload);
      message.success('更新成功');
    } else {
      await moldApi.create(payload);
      message.success('创建成功');
    }
    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    await moldApi.delete(id);
    message.success('删除成功');
    fetchData();
  };

  const columns = [
    { title: '编号', dataIndex: 'code', width: 100, fixed: 'left' as const },
    { title: '名称', dataIndex: 'name', width: 150, fixed: 'left' as const },
    { title: '规格', dataIndex: 'spec', width: 160, ellipsis: true },
    { title: '类型', dataIndex: 'category', width: 90 },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: string) => {
        const info = MOLD_STATUS_MAP[v] || { label: v, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    { title: '位置', dataIndex: 'location', width: 100 },
    { title: '制造商', dataIndex: 'manufacturer', width: 120, ellipsis: true },
    {
      title: '寿命', width: 150,
      render: (_: any, r: Mold) => {
        const pct = r.expected_life > 0 ? Math.min(100, Math.round(r.current_life / r.expected_life * 100)) : 0;
        const color = pct > 90 ? '#ff4d4f' : pct > 70 ? '#faad14' : '#52c41a';
        return (
          <div>
            <Progress percent={pct} size="small" strokeColor={color} style={{ width: 100 }} />
            <span style={{ fontSize: 12, color: '#999' }}>{r.current_life.toLocaleString()} / {r.expected_life.toLocaleString()}</span>
          </div>
        );
      },
    },
    { title: '购入日期', dataIndex: 'purchase_date', width: 110 },
    {
      title: '操作', width: 150, fixed: 'right' as const,
      render: (_: any, record: Mold) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <Card className="page-card search-bar">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Space wrap>
            <Input
              placeholder="搜索编号/名称"
              prefix={<SearchOutlined />}
              value={params.keyword}
              onChange={e => setParams(p => ({ ...p, keyword: e.target.value }))}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="状态"
              value={params.status || undefined}
              onChange={v => setParams(p => ({ ...p, status: v || '' }))}
              options={statusOptions}
              style={{ width: 120 }}
              allowClear
            />
            <Select
              placeholder="类型"
              value={params.category || undefined}
              onChange={v => setParams(p => ({ ...p, category: v || '' }))}
              options={categoryOptions}
              style={{ width: 120 }}
              allowClear
            />
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增模具</Button>
          </Space>
        </div>
      </Card>

      <Card className="page-card">
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: params.page,
            pageSize: params.pageSize,
            total,
            showSizeChanger: true,
            showTotal: t => `共 ${t} 条`,
            onChange: (page, pageSize) => setParams(p => ({ ...p, page, pageSize })),
          }}
        />
      </Card>

      <Modal
        title={editing ? '编辑模具' : '新增模具'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        width={640}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="code" label="模具编号" rules={[{ required: true, message: '请输入编号' }]}>
              <Input placeholder="如 MJ-001" />
            </Form.Item>
            <Form.Item name="name" label="模具名称" rules={[{ required: true, message: '请输入名称' }]}>
              <Input placeholder="如 前保险杠模具" />
            </Form.Item>
            <Form.Item name="spec" label="规格">
              <Input placeholder="如 1200×800×600mm" />
            </Form.Item>
            <Form.Item name="category" label="类型">
              <Select placeholder="选择类型" options={categoryOptions} allowClear />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select placeholder="选择状态" options={statusOptions} />
            </Form.Item>
            <Form.Item name="location" label="存放位置">
              <Input placeholder="如 A区-01" />
            </Form.Item>
            <Form.Item name="manufacturer" label="制造商">
              <Input placeholder="制造商名称" />
            </Form.Item>
            <Form.Item name="purchase_date" label="购入日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="warranty_date" label="保修日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="expected_life" label="预期寿命（次）">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="如 100000" />
            </Form.Item>
            <Form.Item name="current_life" label="当前寿命（次）">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="如 50000" />
            </Form.Item>
          </div>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
