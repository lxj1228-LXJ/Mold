import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Tag, Space, message, Popconfirm, Card } from 'antd';
import { PlusOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import { partsApi } from '../api';
import type { SparePart } from '../types';

const categoryOptions = ['成型零件', '弹性元件', '密封元件', '导向零件', '冷却系统', '加热系统', '温控元件', '其他'].map(c => ({ value: c, label: c }));

export default function Parts() {
  const [data, setData] = useState<SparePart[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({ page: 1, pageSize: 10, keyword: '', category: '', low_stock: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SparePart | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await partsApi.list(params);
      setData(res.list);
      setTotal(res.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [params]);

  const handleAdd = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const handleEdit = (r: SparePart) => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); };

  const handleSave = async () => {
    const values = await form.validateFields();
    if (editing) {
      await partsApi.update(editing.id, values);
      message.success('更新成功');
    } else {
      await partsApi.create(values);
      message.success('创建成功');
    }
    setModalOpen(false);
    fetchData();
  };

  const columns = [
    { title: '编号', dataIndex: 'code', width: 100 },
    { title: '名称', dataIndex: 'name', width: 140 },
    { title: '规格', dataIndex: 'spec', width: 140, ellipsis: true },
    { title: '分类', dataIndex: 'category', width: 100 },
    { title: '单位', dataIndex: 'unit', width: 60 },
    {
      title: '库存', dataIndex: 'stock', width: 100,
      render: (v: number, r: SparePart) => {
        const isLow = v <= r.min_stock;
        return (
          <span style={{ color: isLow ? '#ff4d4f' : undefined, fontWeight: isLow ? 700 : undefined }}>
            {isLow && <WarningOutlined style={{ marginRight: 4 }} />}{v}
          </span>
        );
      },
    },
    {
      title: '最低库存', dataIndex: 'min_stock', width: 90,
      render: (v: number) => <Tag>{v}</Tag>,
    },
    {
      title: '状态', width: 90,
      render: (_: any, r: SparePart) => {
        if (r.stock === 0) return <Tag color="error">缺货</Tag>;
        if (r.stock <= r.min_stock) return <Tag color="warning">库存不足</Tag>;
        return <Tag color="success">正常</Tag>;
      },
    },
    { title: '单价', dataIndex: 'price', width: 90, render: (v: number) => `¥${v?.toFixed(2)}` },
    { title: '供应商', dataIndex: 'supplier', width: 120, ellipsis: true },
    {
      title: '操作', width: 150, fixed: 'right' as const,
      render: (_: any, r: SparePart) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => partsApi.delete(r.id).then(() => { message.success('已删除'); fetchData(); })}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div className="search-bar" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space wrap>
          <Input placeholder="搜索编号/名称" value={params.keyword} onChange={e => setParams(p => ({ ...p, keyword: e.target.value }))} style={{ width: 200 }} allowClear />
          <Select placeholder="分类" value={params.category || undefined} onChange={v => setParams(p => ({ ...p, category: v || '' }))} options={categoryOptions} style={{ width: 120 }} allowClear />
          <Select placeholder="库存状态" value={params.low_stock || undefined} onChange={v => setParams(p => ({ ...p, low_stock: v || '' }))} style={{ width: 130 }} allowClear
            options={[{ value: '1', label: '仅显示库存不足' }]}
          />
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增备件</Button>
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
        title={editing ? '编辑备件' : '新增备件'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="code" label="备件编号" rules={[{ required: true, message: '请输入编号' }]}>
              <Input placeholder="如 BJ-001" />
            </Form.Item>
            <Form.Item name="name" label="备件名称" rules={[{ required: true, message: '请输入名称' }]}>
              <Input placeholder="备件名称" />
            </Form.Item>
            <Form.Item name="spec" label="规格">
              <Input placeholder="规格型号" />
            </Form.Item>
            <Form.Item name="category" label="分类">
              <Select placeholder="选择分类" options={categoryOptions} allowClear />
            </Form.Item>
            <Form.Item name="unit" label="单位">
              <Input placeholder="如：个、根、套" />
            </Form.Item>
            <Form.Item name="stock" label="当前库存">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="min_stock" label="最低库存">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="price" label="单价(元)">
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            <Form.Item name="supplier" label="供应商">
              <Input placeholder="供应商名称" />
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
