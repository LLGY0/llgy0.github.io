---
title: SO-VITS-SVC工作流程
published: 2026-11-12
updated: 2026-11-12
description: 记录SO-VITS-SVC流程
category:
  - Study
tags:
  - AI
draft: false
---
# 0.0 事前准备
在Autodl 上租机器跑 so-vits-svc（4090 24 GB+16 vCPU Intel(R) Xeon(R) Platinum 8352V CPU @ 2.10GHz）
版本：sovits4.1-stable
参考项目仓库：https://github.com/svc-develop-team/so-vits-svc 
参考视频：https://www.bilibili.com/video/BV1So4y1g7He/ 
参考文档：https://www.yuque.com/kisspielengniaoniao/dp89hz/vh4vfw4s743rdx3q

下面是关于几个 编码器 以及 f0预测器 的区别说明(感谢bilibili@羽毛布团)
编码器,默认vec768l12,不推荐ver25619,不提供基于该模型训练,如需要可拉取其他镜像
vec256l9: ContentVec(256Layer9)，旧版本叫v1，So-VITS-SVC 4.0的基础版本，暂不支持扩散模型(不推荐)
vec768l12: 特征输入更换为ContentVec的第12层Transformer输出，更还原音色，支持响度嵌入(768特有口胡)
hubertsoft: So-VITS-SVC 3.0使用的编码器，咬字更为准确，但可能存在音色泄露问题(一个模型只训练一哥声音应该能很好地避免这个问题(?)
whipser: 咬字更为准确,但是音色还原度不如vec，并且更吃配置。请注意使用这个编码器的时候单个训练数据的长度需要小于30s
cnhubertlarge:hubertsoft的优化与更支持中文版本

f0预测器
rmvpe：crepe的完全上位替代，推荐使用
crepe: 抗噪能力最强，但预处理速度很慢(数据集嘈杂推荐使用)
pm: 预处理速度快，但抗噪能力较弱 
dio: 原来预处理使用的f0预测器 
harvest: 有一定抗噪能力，预处理显存占用友好(显存小推荐使用)
fcpe:  性能需求低，速度快，效果还不错

so-vits-svc 4.1 的 44k 模型 + 浅扩散，batch 12 时显存约 18～20 GB。batch 16 会贴到 22 GB 以上，随时可能 OOM。24 GB 卡跑 batch 12 是最舒服的位置。

# 1.0 速查代码
```bash
目录
cd /root/autodl-tmp/workdir/so-vits-svc

训练
python train.py -c configs/config.json -m 44k

续训
python train.py -c configs/config.json -m 44k -l logs/44k/G_20000.pth

看曲线
tensorboard --logdir logs/44k --port 6006 --bind_all

推理
python inference_main.py -m "logs/44k/G_40000.pth" -c "configs/config.json" \
  -n "test.wav" -t 0 -s Hotaru -k 100

独立扩散（4.0）
python diffusion/diffusion.py -c configs/diffusion.yaml
```
# 2.0 提人声
（部分教程使用UVR5或Spleeter进行人声提取，可做为备选方案，参考：https://blog.csdn.net/c858845275/article/details/145998322） （参考2：https://zhuanlan.zhihu.com/p/630115251）
切片工具audio-slicer。第一部分是分离背景音和人声，第二步是进行音频分割。项目地址：https://github.com/ZFTurbo/Music-Source-Separation-Training及webui项目地址：https://github.com/SUC-DriverOld/MSST-WebUI
工具链接：https://github.com/flutydeer/audio-slicer 
Step 1:Running inference using big_betase.ckpt
Step 2: Running inference using model_mel_band_roformer_karaoke_aufr33_viperx_sdr_10.1956.ckpt
Step 3: Running inference using dereverb_mel_band_roformer_less_aggressive_anvuew_sdr_18.8o5o.ckpt

# 3.0 进行数据集的重采样；选训练使用的特征编码器和f0预测器；配置文件修改
配置文件存放在config文件夹，名为config.json
扩散模型的配置文件默认就行,如需查看参数，请见/config_template/diffusion_template.yaml
all_in_mem,cache_all_data：加载所有数据集到内存中，硬盘IO过于低下、同时内存容量 远大于 数据集体积时可以启用(可以较大的提升训练速度)
epoch 总最大训练轮数,中途可中断训练，继续训练会从保存的最后一个模型处开始训练,不一定需要全部训练完，一般3000，4000就可以试试效果，大概1w,2w就能比较好的拟合了
batch_size 根据显存大小和数据集大小调节,默认值6,显存够可选12，但是请不要太大
learning_rat 学习率，请和你的batch_size同步,默认为0.0001.当batch_size改为12时，学习率应该改为0.0002
eval_interval 每隔多少步保存一次模型,会自动清除老的模型。默认800steps保存一次,请配合keep_ckpt参数设置
keep_ckpts 一共需要保存多少个模型，默认3，一组模型1G左右，看你硬盘大小    记得备份优秀模型防止被删除
log_interval 每个多少步输出一次训练日志，
loss 损失值 一般越低越好.一般在28左右,如果特别大请检查是否加载底模/底模是否对应编码器/数据集是否有问题
warmup_epochs 预热轮数，此时学习率不会衰减
seed 模型初始化种子.如果训练效果不理想，可以换一个种子重新训练

编码器
#默认使用带响度嵌入的768
!python preprocess_flist_config.py --speech_encoder vec768l12 --vol_aug
!rsync -v pre_trained_model/768l12/* logs/44k

f0预测器
#默认使用rmvpe且带浅扩散
!python preprocess_hubert_f0.py --f0_predictor rmvpe --use_diff --num_processes 8
%cp pre_trained_model/diffusion/768l12/* logs/44k/diffusion

主模型训练
#进入项目文件夹
%cd /root/autodl-tmp/workdir/so-vits-svc
!python train.py -c configs/config.json -m 44k

浅扩散模型训练
%cd /root/autodl-tmp/workdir/so-vits-svc
!python train_diff.py -c configs/diffusion.yaml 

# 4.0 训练
## 关键指标

| 曲线 | 全称 | 意义 | 数值范围 |
|---|---|---|---|
| `g/mel` | mel 重建 loss | **核心指标**，频谱包络的 L1 误差 × 45 | 45 → 17 |
| `g/kl` | KL 散度 | 后验与先验的距离。太低 = posterior collapse | 2.5 → -7 |
| `g/fm` | feature matching | G 输出与真实音频在 D 中间层的差距 | 12 → 9 |
| `g/f0` | 音高 loss | 基频预测误差 | 0.003 → 1e-4 |
| `g/total` | G 总损失 | 上述加权和 + 对抗损失 | 46 → 35 |
| `d/total` | D 总损失 | 判别器的 BCE 之和 | 2.1 附近抖 |


| 指标 | 健康区 | 该停的信号 |
|---|---|---|
| `loss/g/mel` | 降到 **17～19** 就够用 | 连续 3000 步不动 |
| `loss/g/kl` | **0.3 ～ 0.9** | 破 0 且 mel 同时停滞 |
| `loss/d/total` | **1.8 ～ 2.4** 之间抖 | 掉到 1.4 以下或冲到 2.6 以上贴住 |

| `mel` | 听感 |
|---|---|
| 40 ～ 50 | 训练起点，基本是噪声 |
| 30 ～ 25 | 能听出是人声，但不像特定的人 |
| **25 ～ 20** | 能听出是谁，但粗糙、有毛刺 |
| **20 ～ 17** | 可用，日常听感过关 |
| 17 ～ 14 | 相当像 |
| < 12 | 大概率过拟合 |

| `kl` | 含义 | 动作 |
|---|---|---|
| 1.5 ～ 2.5 | 训练早期正常 | 不动 |
| **0.5 ～ 1.0** | **健康** | 不动 |
| 0.0 ～ 0.5 | 后验收紧 | 继续，准备试听 |
| -0.1 ～ -2.0 | 常见，绝大多数可用模型在这 | 继续 |
| **-5 以下且 mel 停滞** | **塌缩**，输出会含糊吞字 | **停** |

| `d/total` | 含义 |
|---|---|
| 1.8 ～ 2.4 之间抖 | **正常平衡** |
| 掉到 1.4 以下贴住 | D 被打穿，G 失去梯度 |
| 冲到 2.6 以上贴住 | D 太强，G 学不动 |
| **振幅 > 0.4** | **lr 过高，G/D 不同步** |

```
kl 降 + mel 降  → 健康
kl 降 + mel 平  → 危险，模型在放弃信息（posterior collapse）
kl 平 + mel 平  → 平台期，整个优化停止推进   ← 最常见
kl 平 + mel 降  → 少见但也好
```

## 训练策略
| 参数 | 本次值 | 意义 | 怎么调 |
|---|---|---|---|
| `log_interval` | 50 | 每 N 步打印一行日志 | 调小看得细，但刷屏 |
| `eval_interval` | 200 | 每 N 步跑一次验证 | 200 太频繁，拖慢 5～10%；改 1000 更合理 |
| `seed` | 1234 | 随机种子 | 固定，便于复现 |
| `epochs` | 10000 | **最大** epoch 数 | 见下方警告 |
| `learning_rate` | 0.00012 | 初始学习率 | 见 3.5 调参表 |
| `betas` | [0.8, 0.99] | AdamW 的 β1/β2 | 不动 |
| `eps` | 1e-09 | AdamW 的 ε | 不动 |
| `batch_size` | 12 | 每步样本数 | 显存允许就往上加 |
| `fp16_run` | false | 混合精度 | 4090 可开 true，提速 30～40%，但引入不稳定 |
| `half_type` | fp16 | 半精度类型 | 40 系可改 `bf16`（更稳） |
| `lr_decay` | **0.999** | 每 epoch 的 lr 乘数 | **关键参数，见 3.4** |
| `segment_size` | 10240 | 每步截取的采样点数 | 10240 ÷ 44100 ≈ 0.23 s |
| `init_lr_ratio` | 1 | warmup 起点占 lr 的比例 | 1 = 从满 lr 开始 |
| `warmup_epochs` | 10 | 前 N 个 epoch 线性升 lr | 防止第一步就炸 |
| `c_mel` | 45 | mel loss 权重 | **别动**，改它会改变整个 loss 尺度 |
| `c_kl` | 1.0 | kl loss 权重 | 别动；调大抑制过拟合，调小更敢表达 |
| `use_sr` | true | 是否训练浅扩散分支 | 4.1 的核心 |
| `max_speclen` | 512 | 扩散的最大频谱长度 | 与上面对应 |
| `keep_ckpts` | 8 | 保留最近 N 个 checkpoint | 每个 250 MB，注意磁盘 |
| `all_in_mem` | true | 全部数据预载入内存 | 数据 < 2 GB 时开，快 |
| `vol_aug` | true | 音量增强 | 提升鲁棒性，保持开 |

## 音频参数
| 参数 | 值 | 意义 |
|---|---|---|
| `sampling_rate` | 44100 | 采样率，**改了必须重训** |
| `filter_length` | 2048 | STFT 窗长 |
| `hop_length` | 512 | 帧移，44100 ÷ 512 ≈ 86 帧/秒 |
| `win_length` | 2048 | 窗长，与 filter_length 一致 |
| `n_mel_channels` | 80 | mel 频带数，**so-vits-svc 的固定值** |
| `mel_fmin` | 0.0 | mel 低频截断 |
| `mel_fmax` | 22050 | mel 高频截断 = 奈奎斯特频率 |
| `max_wav_value` | 32768.0 | 16 bit 满量程 |
| `unit_interpolate_mode` | nearest | contentvec 特征的时间插值方式 |

## 网络结构
| 参数 | 值 | 意义 | 能不能改 |
|---|---|---|---|
| `speech_encoder` | vec768l12 | 内容编码器：contentvec 768 维第 12 层 | **改了要换预训练底模** |
| `ssl_dim` | 768 | 编码器输出维度 | 同上 |
| `gin_channels` | 768 | 说话人嵌入维度 | 同上 |
| `n_speakers` | 1 | 说话人数量 | 单说话人 |
| `speaker_embedding` | false | 是否用说话人嵌入 | 单说话人设 false |
| `vol_embedding` | true | 音量嵌入 | 保持 true |
| `inter_channels` | 192 | 中间层通道 | **危险区** |
| `hidden_channels` | 192 | 隐藏层通道 | **危险区** |
| `filter_channels` | 768 | Transformer 前馈维度 | **危险区** |
| `n_heads` | 2 | 注意力头数 | **危险区** |
| `n_layers` | 6 | Transformer 层数 | **危险区** |
| `p_dropout` | 0.1 | dropout 率 | 0.1～0.15 可微调 |
| `use_depthwise_conv` | false | 深度可分离卷积 | **危险区** |
| `use_transformer_flow` | false | 是否用 Transformer 流 | **危险区** |
| `n_flow_layer` | 4 | 流的层数 | **危险区** |
| `n_layers_q` | 3 | 后验编码器层数 | **危险区** |
| `use_automatic_f0_prediction` | true | 模型内置 f0 预测分支 | 见 9.4 |
| `resblock` | "1" | 残差块类型 | 不动 |
| `upsample_initial_channel` | 512 | 上采样初始通道 | 不动 |

## batch_size 与 learning_rate 的搭配
| batch | 合适 lr | 备注 |
|---|---|---|
| 4 | 7e-5 | 8 GB 卡 |
| 6 | 1e-4 | **官方默认** |
| 8 | 1.2 ～ 1.4e-4 | |
| 10 | 1.4 ～ 2e-4 | 偏激进 |
| 12 | 1.6 ～ 2.2e-4 | 4090 甜点；但 1.2e-4 更稳 |
| 16 | 2 ～ 2.6e-4 | 24 GB 贴边，随时 OOM |

**本次最终选了 `batch 12 + lr 1.2e-4`——比表里的推荐值低，故意保守。

# 5.0 推理

使用webui进行推理,也可以进行训练，不过用笔记本会多两个编码器
运行后会生成两条链接，一条是本地端口6006，通过自定义服务访问或者通过ssh隧道访问(强烈建议通过ssh隧道，关于如何使用请看 BV1oh4y1n7Nv )
另一条是公共端口，可以直接在其他电脑上打开，貌似只能用于推理
（注意：推理前把目标音频的人声wav放置于文件夹raw下）

## 代码（命令行）
```bash
python inference_main.py \
  -m "logs/44k/G_40000.pth" \
  -c "configs/config.json" \
  -n "test.wav" \
  -t 0 \
  -s Hotaru \
  -k 100
```

| 参数 | 意义 |
|---|---|
| `-m` | 模型 checkpoint |
| `-c` | config 路径，**必须与训练时一致** |
| `-n` | 输入文件名，**相对 `raw/` 目录** |
| `-t` | 变调，半音数。0 不变，12 升八度 |
| `-s` | 说话人名，**必须与 config 里 `spk` 的 key 完全一致**（大小写敏感） |
| `-k` | 浅扩散步数，0 = 关闭，100 = 满 |
| `-f0p` | f0 预测器：`pm` / `dio` / `harvest` / `crepe` / `rmvpe` |
| `-ns` | noise_scale |
| `-sd` | 切片阈值 dB |

## Webui下关键参数

| 项 | 默认 | 本次调整 | 作用 |
|---|---|---|---|
| **f0 预测器** | pm | **rmvpe** | 必须与预处理一致，见 9.1 |
| **自动 f0 预测** | 关 | **关** | 勾了会跑调（实测） |
| **变调** | 0 | 0 | 升调会推出训练音域 |
| **浅扩散步数** | 一 | 100 | 满值，质量最好 |
| **noise_scale** | 0.4 | 0.4 → 0.25 → **0.33** | 太低杀瞬态，太高发糊 |
| **交叉淡入长度** | 1 | **0.4**（从 1 改） | **电音元凶，见 9.2** |
| **丢弃头尾比例** | 0.75 | 保持 **0.75** | 改动会吞字/断句 |
| **二次编码** | 关 | 关 | 玄学，默认关 |
| **响度包络融合** | 0 | 0 | 音量忽大忽小时可试 0.3 |
| **动态声线融合** | 关 | 关 | 需手动混音轨 |
| **NSF_HIFIGAN 增强** | 关 | **关** | 对训好的模型有反效果 |
| **NSF 增强音域** | 0 | **12** | **治高音爆音的唯一有效参数** |
| **切片阈值** | -50 | -50 | |
| **聚类混合比** | 0 | 0 | 单说话人没有聚类模型 |

# 6.0 扩散模型相关
## 关键参数
| 参数 | 值 | 意义 |
|---|---|---|
| `n_layers` | 20 | 扩散网络层数（**不可改**，决定能否加载预训练底模） |
| `n_chans` | 512 | 通道数（不可改） |
| `n_hidden` | 256 | 隐藏维度（不可改） |
| `timesteps` | 1000 | 扩散步数（不可改） |
| `k_step_max` | 0 | 0 = 训全部时间步 |
| `batch_size` | 32 | **块数 ÷ batch 必须 > 1** |
| `decay_step` | 20000 | 每 N 步 lr × gamma |
| `gamma` | 0.5 | 每次衰减的乘数 |
| `amp_dtype` | fp16 | 40 系可 bf16 |
| `cache_all_data` | true | 全部缓存 |
| `cache_device` | cpu | 缓存位置 |