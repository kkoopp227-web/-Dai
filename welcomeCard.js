const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');

function registerBundledFonts() {
  const fonts = [
    { file: 'Tajawal-Regular.ttf', family: 'Tajawal' },
    { file: 'Tajawal-Bold.ttf', family: 'Tajawal Bold' },
  ];
  for (const f of fonts) {
    try {
      const buf = fs.readFileSync(path.join(__dirname, 'fonts', f.file));
      GlobalFonts.register(buf, f.family);
    } catch (_) {}
  }
}

registerBundledFonts();

const DEFAULT_SETTINGS = {
  text: {
    main: 'Welcome to the server',
    sub: '{member}',
    inviter: 'invited by',
    align: 'left',
    x: 330,
    y: 170,
    color: '#ffffff',
  },
  avatar: {
    size: 200,
  },
  background: {
    type: 'gradient',
    color1: '#3b82f6',
    color2: '#1e1b4b',
    solid: '#2b2d31',
    imageUrl: null,
  },
  serverBadge: {
    enabled: true,
  },
};

function deepMerge(base, override) {
  if (!override) return JSON.parse(JSON.stringify(base));
  const result = JSON.parse(JSON.stringify(base));
  const keys = Object.keys(override);
  for (const key of keys) {
    if (result[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
      result[key] = deepMerge(result[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

function resolveInviterName(guild, inviter) {
  if (!inviter) return null;
  if (inviter.id && guild.members.cache.has(inviter.id)) {
    return guild.members.cache.get(inviter.id).displayName;
  }
  return inviter.tag || null;
}

function resolveInviterUsername(guild, inviter) {
  if (!inviter) return null;
  if (inviter.id && guild.members.cache.has(inviter.id)) {
    return guild.members.cache.get(inviter.id).user.username;
  }
  return (inviter.tag || '').split('#')[0] || null;
}

function replacePlaceholders(template, member, inviterName) {
  let text = String(template || '');
  text = text.replaceAll('{member}', member.displayName);
  text = text.replaceAll('{username}', member.user.username);
  text = text.replaceAll('{mention}', `<@${member.id}>`);
  text = text.replaceAll('{server}', member.guild.name);
  text = text.replaceAll('{inviter}', inviterName || 'غير معروف');
  return text;
}

function fillTextWithAlign(ctx, text, settings, lineY, width) {
  const t = settings.text;
  let x = 0;
  ctx.textAlign = t.align;
  if (t.align === 'right') {
    x = width - t.x;
  } else if (t.align === 'left') {
    x = t.x;
  } else {
    x = width / 2 + t.x;
  }
  ctx.fillText(text, x, lineY);
}

async function drawBackground(ctx, settings, width, height) {
  const bg = settings.background;

  if (bg.type === 'image' && bg.imageUrl) {
    try {
      const bkg = await loadImage(bg.imageUrl);
      const scale = Math.max(width / bkg.width, height / bkg.height);
      const w = bkg.width * scale;
      const h = bkg.height * scale;
      ctx.drawImage(bkg, (width - w) / 2, (height - h) / 2, w, h);
      return;
    } catch (_) {}
  }

  if (bg.type === 'solid') {
    ctx.fillStyle = bg.solid || '#2b2d31';
    ctx.fillRect(0, 0, width, height);
    return;
  }

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, bg.color1 || '#3b82f6');
  grad.addColorStop(1, bg.color2 || '#1e1b4b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(width - 90, 130, 230, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(110, height + 40, 170, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

async function drawServerBadge(ctx, guild, settings, width) {
  if (settings.serverBadge && settings.serverBadge.enabled === false) return;

  const iconURL = guild.iconURL({ extension: 'png', size: 128 });
  let icon = null;
  if (iconURL) {
    try { icon = await loadImage(iconURL); } catch (_) {}
  }

  const s = 52;
  const cx = width - 75;
  const cy = 48;
  const nameX = cx - s / 2 - 14;

  if (icon) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, s / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(icon, cx - s / 2, cy - s / 2, s, s);
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, s / 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.font = '24px Tajawal';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const dots = guild.name.length > 18 ? guild.name.slice(0, 18) + '…' : guild.name;
  ctx.fillText(dots, nameX, cy);
}

async function createWelcomeCard(member, inviter, userSettings) {
  const settings = deepMerge(DEFAULT_SETTINGS, userSettings);
  const width = 900;
  const height = 420;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  await drawBackground(ctx, settings, width, height);

  const avatarSize = settings.avatar.size;
  const avatarX = 100;
  const avatarY = 110;

  if (avatarSize > 0) {
    let avatar = null;
    try {
      avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 512 }));
    } catch (_) {}

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (avatar) {
      ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    } else {
      ctx.fillStyle = '#334155';
      ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    }
    ctx.restore();
  }

  await drawServerBadge(ctx, member.guild, settings, width);

  const inviterName = resolveInviterName(member.guild, inviter);
  const inviterUsername = resolveInviterUsername(member.guild, inviter);
  const t = settings.text;
  const boxX = t.x;

  ctx.textBaseline = 'middle';

  ctx.fillStyle = t.color || '#ffffff';
  ctx.font = 'bold 44px Tajawal';
  ctx.textAlign = 'center';
  ctx.fillText(replacePlaceholders(t.main, member, inviterName), width / 2, 55);

  ctx.textAlign = 'left';
  ctx.fillStyle = t.color || '#ffffff';
  ctx.font = 'bold 36px Tajawal';
  ctx.fillText(replacePlaceholders(t.sub, member, inviterName), boxX, t.y);

  ctx.font = '24px Tajawal';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText(`jnd @${member.user.username}`, boxX, t.y + 70);

  ctx.font = '24px Tajawal';
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillText(`fr @${inviterUsername || 'غير معروف'}`, boxX, t.y + 120);

  return canvas.toBuffer('image/png');
}

module.exports = { createWelcomeCard, DEFAULT_SETTINGS };