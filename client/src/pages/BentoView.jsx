import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'
import Toast, { useToast } from '../components/Toast'
import { getSocialIcon, getSocialBrandColor } from '../components/SocialIcons'

// Collides two blocks
const collides = (b1, b2) => {
  if (b1.id === b2.id) return false;
  return (
    b1.x < b2.x + b2.w &&
    b1.x + b1.w > b2.x &&
    b1.y < b2.y + b2.h &&
    b1.y + b1.h > b2.y
  );
};

// Resolve collisions by pushing overlapping blocks down. If applyGravity is true, compact blocks upwards.
const resolveLayout = (blocks, movingBlock, applyGravity = false) => {
  const sorted = [...blocks].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  const resolved = [];

  if (movingBlock) {
    resolved.push({ ...movingBlock });
  }

  for (const block of sorted) {
    if (movingBlock && block.id === movingBlock.id) continue;

    let targetBlock = { ...block };

    // Resolve collisions by moving the block down until it doesn't collide with any already-resolved blocks
    while (resolved.some(r => collides(r, targetBlock))) {
      targetBlock.y += 1;
    }

    resolved.push(targetBlock);
  }

  if (!applyGravity) {
    return resolved;
  }

  // Final compaction: push elements upwards if there's empty space below them (gravity)
  const compacted = [];
  const sortedResolved = resolved.sort((a, b) => a.y - b.y);

  for (const block of sortedResolved) {
    let targetBlock = { ...block };
    if (movingBlock && block.id === movingBlock.id) {
      compacted.push(targetBlock);
      continue;
    }

    while (targetBlock.y > 0) {
      targetBlock.y -= 1;
      if (compacted.some(c => collides(c, targetBlock))) {
        targetBlock.y += 1; // move back down
        break;
      }
    }
    compacted.push(targetBlock);
  }

  return compacted;
};

// Data migration placing function
const placeBlocks = (blocks, applyGravity = false) => {
  let placed = [];
  for (const block of blocks) {
    if (block.x !== undefined && block.y !== undefined) {
      placed.push(block);
      continue;
    }

    // Determine default w and h
    let w = 2; // default medium
    if (block.w !== undefined) {
      w = block.w;
    } else if (block.gridSpan) {
      if (block.gridSpan <= 3) w = 1;
      else if (block.gridSpan <= 6) w = 2;
      else if (block.gridSpan <= 9) w = 3;
      else w = 4;
    } else {
      if (block.type === 'location' || block.type === 'image' || block.type === 'custom-emoji') w = 1;
    }

    let h = (block.type === 'youtube' || block.type === 'behance') ? 2 : 1;
    if (block.h !== undefined) {
      h = block.h;
    } else if (block.customHeight) {
      h = Math.max(1, Math.round((block.customHeight + 24) / 184));
    }

    let x = 0;
    let y = 0;
    let target = { id: block.id, x, y, w, h };

    while (true) {
      target.x = x;
      target.y = y;
      if (x + w <= 4 && !placed.some(p => collides(p, target))) {
        break;
      }
      x += 1;
      if (x >= 4) {
        x = 0;
        y += 1;
      }
    }

    placed.push({
      ...block,
      x,
      y,
      w,
      h
    });
  }
  return resolveLayout(placed, null, applyGravity);
};

function AvatarDisplay({ avatar }) {
  if (avatar?.type === 'file' && avatar.data) {
    return <img src={avatar.data} alt="avatar" style={{ transform: avatar.transform, width: '100%', height: '100%', objectFit: 'cover' }} />
  }
  if (avatar?.type === 'emoji' && avatar.data) {
    return <span className="bento-banner-avatar-emoji" style={{ fontSize: '4.5rem', lineHeight: '100px' }}>{avatar.data}</span>
  }
  return <img src="/assets/images/foxy_avatar.png" alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
}

export default function BentoView() {
  const { theme, setTheme, avatar, profileName, profileBio, location, socialLinks, profileCardFont } = useOnboarding()
  const navigate = useNavigate()

  // Custom states for interactivity
  const [toastMsg, toastShow, toast] = useToast()
  const [followed, setFollowed] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [isDark, setIsDark] = useState(theme === 'dark')
  const [gridSpacing, setGridSpacing] = useState(false)
  const [editingBlockId, setEditingBlockId] = useState(null)
  const imageInputRef = useRef(null)

  // Sync state with global theme
  useEffect(() => {
    setIsDark(theme === 'dark')
  }, [theme])

  const name = profileName || 'Foxy Man'
  const bio = profileBio || 'Nice to meet you, I\'m a designer!'
  const userLocation = location || 'Salur, Andhra Pradesh, India'

  const getUsername = (platformId, fallback) => {
    if (socialLinks && socialLinks[platformId]) {
      return socialLinks[platformId];
    }
    return fallback;
  }

  // Layout mode state loaded from localStorage
  const [freeGridMode, setFreeGridMode] = useState(() => {
    try {
      const saved = localStorage.getItem('bento_free_grid_mode');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem('bento_free_grid_mode', JSON.stringify(freeGridMode));
  }, [freeGridMode]);

  // Dynamic blocks state with localStorage persistence
  const [gridBlocks, setGridBlocks] = useState(() => {
    try {
      const saved = localStorage.getItem('bento_grid_blocks');
      if (saved) {
        const blocks = JSON.parse(saved);
        let isFree = true;
        try {
          const modeSaved = localStorage.getItem('bento_free_grid_mode');
          if (modeSaved !== null) isFree = JSON.parse(modeSaved);
        } catch { }
        return placeBlocks(blocks, !isFree);
      }
    } catch (e) {
      console.error(e);
    }
    const defaultBlocks = [
      { id: 'loc-block', type: 'location', content: userLocation },
      { id: 'git-block', type: 'github', username: getUsername('github', 'santoshpl') },
      { id: 'img-block', type: 'image', url: '/assets/images/featured_brand_mockup.png' },
      { id: 'beh-block', type: 'behance', title: getUsername('dribbble', 'PurpleLane') + ' Design' },
      { id: 'yt-block', type: 'youtube', title: getUsername('youtube', 'PurpleLane') }
    ];
    let isFree = true;
    try {
      const modeSaved = localStorage.getItem('bento_free_grid_mode');
      if (modeSaved !== null) isFree = JSON.parse(modeSaved);
    } catch { }
    return placeBlocks(defaultBlocks, !isFree);
  });

  useEffect(() => {
    localStorage.setItem('bento_grid_blocks', JSON.stringify(gridBlocks));
  }, [gridBlocks]);

  // Dialog State
  const [activeDialog, setActiveDialog] = useState(null) // 'emoji' | 'link' | 'text' | 'checklist'
  const [dialogInput1, setDialogInput1] = useState('')
  const [dialogInput2, setDialogInput2] = useState('')

  // List block specific states
  const [listTitle, setListTitle] = useState('My List')
  const [listItems, setListItems] = useState(['', '', ''])
  const [shouldFocusLast, setShouldFocusLast] = useState(false)
  const [dialogSize, setDialogSize] = useState('medium')
  const [draggedItemIndex, setDraggedItemIndex] = useState(null)
  const lastItemRef = useRef(null)

  // Container width state and ResizeObserver ref
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Pointer-based Drag & Drop States
  const [potentialDrag, setPotentialDrag] = useState(null);
  const [activeDrag, setActiveDrag] = useState(null);

  // Pointer-based Resize States
  const [activeResize, setActiveResize] = useState(null);

  // Map state to variables used in layout rendering
  const draggedBlockId = activeDrag ? activeDrag.blockId : null;
  const dragPreview = activeDrag ? { x: activeDrag.snapX, y: activeDrag.snapY, w: activeDrag.w, h: activeDrag.h } : null;

  const resizingBlockId = activeResize ? activeResize.blockId : null;
  const resizePreview = activeResize ? { id: activeResize.blockId, x: activeResize.snapX, y: activeResize.snapY, w: activeResize.snapW, h: activeResize.snapH } : null;

  // Pointer event handlers for drag-and-drop
  const handlePointerDownBlock = (e, block) => {
    if (
      e.target.closest('.bento-card-resize-handle') ||
      e.target.closest('.delete-block-btn') ||
      e.target.closest('.edit-block-btn') ||
      e.target.closest('.btn-bento-follow-new') ||
      e.target.closest('.btn-bento-sub-new') ||
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'BUTTON'
    ) {
      return;
    }

    const gap = gridSpacing ? 12 : 24;
    const colWidth = (containerWidth + gap) / 4;
    const rowHeight = 160 + gap;

    setPotentialDrag({
      block,
      pointerId: e.pointerId,
      cardEl: e.currentTarget,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startLeft: block.x * colWidth,
      startTop: block.y * rowHeight
    });
  };

  const handlePointerMoveBlock = (e, blockId) => {
    if (potentialDrag && potentialDrag.block.id === blockId && !activeDrag) {
      const dx = e.clientX - potentialDrag.startPointerX;
      const dy = e.clientY - potentialDrag.startPointerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 5) {
        e.preventDefault();
        try {
          potentialDrag.cardEl.setPointerCapture(potentialDrag.pointerId);
        } catch (err) {
          console.warn("Failed to set pointer capture:", err);
        }

        setActiveDrag({
          blockId: blockId,
          startPointerX: potentialDrag.startPointerX,
          startPointerY: potentialDrag.startPointerY,
          startLeft: potentialDrag.startLeft,
          startTop: potentialDrag.startTop,
          currentLeft: potentialDrag.startLeft + dx,
          currentTop: potentialDrag.startTop + dy,
          snapX: potentialDrag.block.x,
          snapY: potentialDrag.block.y,
          w: potentialDrag.block.w,
          h: potentialDrag.block.h
        });
      }
      return;
    }

    if (activeDrag && activeDrag.blockId === blockId) {
      e.preventDefault();
      const dx = e.clientX - activeDrag.startPointerX;
      const dy = e.clientY - activeDrag.startPointerY;

      const gap = gridSpacing ? 12 : 24;
      const colWidth = (containerWidth + gap) / 4;
      const rowHeight = 160 + gap;

      const currentLeft = activeDrag.startLeft + dx;
      const currentTop = activeDrag.startTop + dy;

      let snapX = Math.round(currentLeft / colWidth);
      snapX = Math.max(0, Math.min(4 - activeDrag.w, snapX));
      let snapY = Math.max(0, Math.round(currentTop / rowHeight));

      setActiveDrag(prev => ({
        ...prev,
        currentLeft,
        currentTop,
        snapX,
        snapY
      }));

      setGridBlocks((prevBlocks) => {
        const movingBlock = prevBlocks.find(b => b.id === blockId);
        if (!movingBlock) return prevBlocks;

        const updated = prevBlocks.map(b =>
          b.id === blockId ? { ...b, x: snapX, y: snapY } : b
        );
        return resolveLayout(updated, { ...movingBlock, x: snapX, y: snapY }, !freeGridMode);
      });
    }
  };

  const handlePointerUpBlock = (e, blockId) => {
    setPotentialDrag(null);

    if (activeDrag && activeDrag.blockId === blockId) {
      e.preventDefault();
      e.stopPropagation();

      const cardEl = e.currentTarget;
      try {
        cardEl.releasePointerCapture(e.pointerId);
      } catch (err) {
        console.warn("Failed to release pointer capture:", err);
      }

      const finalSnapX = activeDrag.snapX;
      const finalSnapY = activeDrag.snapY;

      setGridBlocks((prevBlocks) => {
        const movingBlock = prevBlocks.find(b => b.id === blockId);
        if (!movingBlock) return prevBlocks;

        const updated = prevBlocks.map(b =>
          b.id === blockId ? { ...b, x: finalSnapX, y: finalSnapY } : b
        );
        return resolveLayout(updated, null, !freeGridMode);
      });

      setActiveDrag(null);
    }
  };

  // Pointer event handlers for resize
  const handlePointerDownResize = (e, block, direction) => {
    e.preventDefault();
    e.stopPropagation();

    const handleEl = e.currentTarget;
    try {
      handleEl.setPointerCapture(e.pointerId);
    } catch (err) {
      console.warn("Failed to set pointer capture:", err);
    }

    const gap = gridSpacing ? 12 : 24;
    const colWidth = (containerWidth + gap) / 4;
    const rowHeight = 160 + gap;

    setActiveResize({
      blockId: block.id,
      direction,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startLeft: block.x * colWidth,
      startTop: block.y * rowHeight,
      startWidth: block.w * colWidth - gap,
      startHeight: block.h * rowHeight - gap,
      currentLeft: block.x * colWidth,
      currentTop: block.y * rowHeight,
      currentWidth: block.w * colWidth - gap,
      currentHeight: block.h * rowHeight - gap,
      snapX: block.x,
      snapY: block.y,
      snapW: block.w,
      snapH: block.h
    });
  };

  const handlePointerMoveResize = (e, blockId) => {
    if (!activeResize || activeResize.blockId !== blockId) return;

    e.preventDefault();
    e.stopPropagation();

    const dx = e.clientX - activeResize.startPointerX;
    const dy = e.clientY - activeResize.startPointerY;

    const gap = gridSpacing ? 12 : 24;
    const colWidth = (containerWidth + gap) / 4;
    const rowHeight = 160 + gap;

    let currentLeft = activeResize.startLeft;
    let currentTop = activeResize.startTop;
    let currentWidth = activeResize.startWidth;
    let currentHeight = activeResize.startHeight;

    const block = gridBlocks.find(b => b.id === blockId);
    if (!block) return;

    const direction = activeResize.direction;

    if (direction === 'right') {
      currentWidth = Math.max(colWidth - gap, activeResize.startWidth + dx);
    } else if (direction === 'left') {
      currentLeft = Math.min(activeResize.startLeft + activeResize.startWidth - (colWidth - gap), activeResize.startLeft + dx);
      currentWidth = activeResize.startWidth - (currentLeft - activeResize.startLeft);
    } else if (direction === 'bottom') {
      currentHeight = Math.max(rowHeight - gap, activeResize.startHeight + dy);
    } else if (direction === 'top') {
      currentTop = Math.min(activeResize.startTop + activeResize.startHeight - (rowHeight - gap), activeResize.startTop + dy);
      currentHeight = activeResize.startHeight - (currentTop - activeResize.startTop);
    }

    let snapX = block.x;
    let snapY = block.y;
    let snapW = block.w;
    let snapH = block.h;

    if (direction === 'right') {
      snapW = Math.round((currentWidth + gap) / colWidth);
      snapW = Math.max(1, Math.min(4 - block.x, snapW));
    } else if (direction === 'left') {
      snapX = Math.round(currentLeft / colWidth);
      snapX = Math.max(0, Math.min(block.x + block.w - 1, snapX));
      snapW = block.x + block.w - snapX;
    } else if (direction === 'bottom') {
      snapH = Math.round((currentHeight + gap) / rowHeight);
      snapH = Math.max(1, snapH);
    } else if (direction === 'top') {
      snapY = Math.round(currentTop / rowHeight);
      snapY = Math.max(0, Math.min(block.y + block.h - 1, snapY));
      snapH = block.y + block.h - snapY;
    }

    setActiveResize(prev => ({
      ...prev,
      currentLeft,
      currentTop,
      currentWidth,
      currentHeight,
      snapX,
      snapY,
      snapW,
      snapH
    }));

    setGridBlocks((prevBlocks) => {
      const movingBlock = prevBlocks.find(b => b.id === blockId);
      if (!movingBlock) return prevBlocks;

      const updated = prevBlocks.map(b =>
        b.id === blockId ? { ...b, x: snapX, y: snapY, w: snapW, h: snapH } : b
      );
      return resolveLayout(updated, { ...movingBlock, x: snapX, y: snapY, w: snapW, h: snapH }, !freeGridMode);
    });
  };

  const handlePointerUpResize = (e, blockId) => {
    if (!activeResize || activeResize.blockId !== blockId) return;

    e.preventDefault();
    e.stopPropagation();

    const handleEl = e.currentTarget;
    try {
      handleEl.releasePointerCapture(e.pointerId);
    } catch (err) {
      console.warn("Failed to release pointer capture:", err);
    }

    const finalSnapX = activeResize.snapX;
    const finalSnapY = activeResize.snapY;
    const finalSnapW = activeResize.snapW;
    const finalSnapH = activeResize.snapH;

    setGridBlocks((prevBlocks) => {
      const movingBlock = prevBlocks.find(b => b.id === blockId);
      if (!movingBlock) return prevBlocks;

      const updated = prevBlocks.map(b =>
        b.id === blockId ? { ...b, x: finalSnapX, y: finalSnapY, w: finalSnapW, h: finalSnapH } : b
      );
      return resolveLayout(updated, null, !freeGridMode);
    });

    setActiveResize(null);
  };

  const renderResizeHandles = (block) => (
    <>
      <div
        className={`bento-card-resize-handle right ${resizingBlockId === block.id ? 'resizing' : ''}`}
        onPointerDown={(e) => handlePointerDownResize(e, block, 'right')}
        onPointerMove={(e) => handlePointerMoveResize(e, block.id)}
        onPointerUp={(e) => handlePointerUpResize(e, block.id)}
        title="Drag Right to Resize"
      />
      <div
        className={`bento-card-resize-handle left ${resizingBlockId === block.id ? 'resizing' : ''}`}
        onPointerDown={(e) => handlePointerDownResize(e, block, 'left')}
        onPointerMove={(e) => handlePointerMoveResize(e, block.id)}
        onPointerUp={(e) => handlePointerUpResize(e, block.id)}
        title="Drag Left to Resize"
      />
      <div
        className={`bento-card-resize-handle bottom ${resizingBlockId === block.id ? 'resizing' : ''}`}
        onPointerDown={(e) => handlePointerDownResize(e, block, 'bottom')}
        onPointerMove={(e) => handlePointerMoveResize(e, block.id)}
        onPointerUp={(e) => handlePointerUpResize(e, block.id)}
        title="Drag Bottom to Resize"
      />
      <div
        className={`bento-card-resize-handle top ${resizingBlockId === block.id ? 'resizing' : ''}`}
        onPointerDown={(e) => handlePointerDownResize(e, block, 'top')}
        onPointerMove={(e) => handlePointerMoveResize(e, block.id)}
        onPointerUp={(e) => handlePointerUpResize(e, block.id)}
        title="Drag Top to Resize"
      />
    </>
  );

  useEffect(() => {
    if (shouldFocusLast && lastItemRef.current) {
      lastItemRef.current.focus();
      setShouldFocusLast(false);
    }
  }, [listItems, shouldFocusLast]);

  const openDialog = (type) => {
    if (type === 'instagram') {
      setDialogInput1(socialLinks?.instagram || '')
    } else {
      setDialogInput1('')
    }
    setDialogInput2('')
    setListTitle('My List')
    setListItems(['', '', ''])
    setDialogSize(type === 'emoji' || type === 'link' || type === 'instagram' ? 'small' : 'medium')
    setActiveDialog(type)
  }

  const closeDialog = () => {
    setActiveDialog(null)
    setEditingBlockId(null)
  }

  const handleEditBlock = (block) => {
    setEditingBlockId(block.id)
    setDialogSize(block.size || (block.type === 'custom-emoji' || block.type === 'custom-link' || block.type === 'instagram' ? 'small' : 'medium'))
    if (block.type === 'custom-emoji') {
      setDialogInput1(block.emoji)
      setActiveDialog('emoji')
    } else if (block.type === 'custom-text') {
      setDialogInput1(block.text)
      setActiveDialog('text')
    } else if (block.type === 'custom-link') {
      setDialogInput1(block.title)
      setDialogInput2(block.url)
      setActiveDialog('link')
    } else if (block.type === 'custom-checklist') {
      setListTitle(block.title || 'My List')
      setListItems(block.items || ['', '', ''])
      setActiveDialog('checklist')
    } else if (block.type === 'instagram') {
      setDialogInput1(block.username)
      setActiveDialog('instagram')
    }
  }

  const handleDeleteBlock = (blockId) => {
    setGridBlocks(gridBlocks.filter(b => b.id !== blockId))
    toast('Block deleted!')
    closeDialog()
  }

  const handleDragStartItem = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropItem = (e, targetIndex) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) return;

    const updated = [...listItems];
    const [draggedItem] = updated.splice(draggedItemIndex, 1);
    updated.splice(targetIndex, 0, draggedItem);
    setListItems(updated);
    setDraggedItemIndex(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const blockId = `custom-block-${Date.now()}`
      const newBlock = { id: blockId, type: 'image', url: ev.target.result, w: 1, h: 1 }
      setGridBlocks((prevBlocks) => placeBlocks([...prevBlocks, newBlock], !freeGridMode))
      toast('Custom image block added!')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleDialogSubmit = () => {
    if (activeDialog !== 'checklist' && !dialogInput1.trim()) {
      toast('Please enter the required field')
      return
    }

    if (activeDialog === 'checklist') {
      const filteredItems = listItems.map(i => i.trim()).filter(Boolean)
      if (filteredItems.length === 0) {
        toast('Please add at least one item')
        return
      }
    }

    if (editingBlockId) {
      setGridBlocks(gridBlocks.map(block => {
        if (block.id === editingBlockId) {
          let updatedBlock = { ...block }
          if (block.type === 'custom-emoji') {
            updatedBlock.emoji = dialogInput1
          } else if (block.type === 'custom-text') {
            updatedBlock.text = dialogInput1
          } else if (block.type === 'custom-link') {
            const url = dialogInput2.trim() || 'https://hiprofile.bio'
            updatedBlock.title = dialogInput1
            updatedBlock.url = url
          } else if (block.type === 'custom-checklist') {
            const filtered = listItems.map(i => i.trim()).filter(Boolean)
            updatedBlock.title = listTitle.trim() || 'My List'
            updatedBlock.items = filtered
          } else if (block.type === 'instagram') {
            updatedBlock.username = dialogInput1.trim()
          }
          return updatedBlock
        }
        return block
      }))
      toast('Block updated!')
      closeDialog()
      return
    }

    let newBlock = null;
    const blockId = `custom-block-${Date.now()}`;

    if (activeDialog === 'emoji') {
      newBlock = { id: blockId, type: 'custom-emoji', emoji: dialogInput1, w: 1, h: 1 };
    } else if (activeDialog === 'text') {
      newBlock = { id: blockId, type: 'custom-text', text: dialogInput1, w: 2, h: 1 };
    } else if (activeDialog === 'link') {
      const url = dialogInput2.trim() || 'https://example.com';
      newBlock = { id: blockId, type: 'custom-link', title: dialogInput1, url: url, w: 2, h: 1 };
    } else if (activeDialog === 'checklist') {
      const filtered = listItems.map(i => i.trim()).filter(Boolean);
      newBlock = { id: blockId, type: 'custom-checklist', title: listTitle.trim() || 'My List', items: filtered, w: 2, h: 1 };
    } else if (activeDialog === 'instagram') {
      newBlock = { id: blockId, type: 'instagram', username: dialogInput1.trim(), w: 2, h: 2 };
    }

    if (newBlock) {
      setGridBlocks((prevBlocks) => placeBlocks([...prevBlocks, newBlock], !freeGridMode))
      toast('New block added to grid!')
    }
    closeDialog()
  }

  const handleAddSocialBlock = (platform) => {
    const blockId = `custom-block-${Date.now()}`;
    const newBlock = { id: blockId, type: platform, w: 2, h: 2 };
    setGridBlocks((prevBlocks) => placeBlocks([...prevBlocks, newBlock], !freeGridMode))
    toast(`New ${platform} block added!`)
  }

  // Preset additions
  const handleAddImageBlock = () => {
    const images = [
      '/assets/images/fintech_dashboard.png',
      '/assets/images/ecommerce_app.png',
      '/assets/images/design_system.png',
      '/assets/images/ar_glass.png'
    ];
    const imgUrl = images[gridBlocks.filter(b => b.type === 'image').length % images.length];
    const blockId = `custom-block-${Date.now()}`;
    const newBlock = { id: blockId, type: 'image', url: imgUrl, w: 1, h: 1 };
    setGridBlocks((prevBlocks) => placeBlocks([...prevBlocks, newBlock], !freeGridMode))
    toast('Project Image card added!')
  }

  const handleAddAIBlock = () => {
    const blockId = `custom-block-${Date.now()}`;
    const AIQuotes = [
      "✨ Simplicity is the ultimate sophistication.",
      "🎨 Design is not just what it looks like and feels like. Design is how it works.",
      "🚀 Pixel perfect designs built with love & coffee.",
      "💡 Creativity is intelligence having fun."
    ];
    const quote = AIQuotes[Math.floor(Math.random() * AIQuotes.length)];
    const newBlock = { id: blockId, type: 'custom-text', text: quote, w: 2, h: 1 };
    setGridBlocks((prevBlocks) => placeBlocks([...prevBlocks, newBlock], !freeGridMode))
    toast('AI Quote block generated!')
  }

  const handleToggleGridSpacing = () => {
    setGridSpacing(!gridSpacing)
    toast(gridSpacing ? 'Grid spacing set to Normal' : 'Grid spacing set to Compact')
  }

  const handleToggleLayoutMode = () => {
    const newMode = !freeGridMode;
    setFreeGridMode(newMode);
    toast(newMode ? 'Free Grid layout enabled!' : 'Auto-Compact layout enabled!');
    if (!newMode) {
      setGridBlocks((prevBlocks) => resolveLayout(prevBlocks, null, true));
    }
  };

  // Copy Profile Link
  const handleCopyLink = () => {
    const url = `hiprofile.bio/${getUsername('github', 'foxyman')}`
    navigator.clipboard.writeText(url)
    toast('Profile link copied to clipboard!')
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    setIsDark(nextTheme === 'dark')
    toast(`Switched to ${nextTheme} theme!`)
  }

  // Pre-calculate card grid parameters for absolute rendering
  const activePreviewRow = (dragPreview || resizePreview) ? (dragPreview || resizePreview).y + (dragPreview || resizePreview).h : 0;
  const maxPopulatedRow = Math.max(0, activePreviewRow, ...gridBlocks.map(b => (b.y || 0) + (b.h || 1)));
  const gap = gridSpacing ? 12 : 24;
  const colWidth = (containerWidth + gap) / 4;
  const rowHeight = 160 + gap;
  const gridHeight = maxPopulatedRow * rowHeight - gap;
  const totalContainerHeight = Math.max(0, gridHeight) + 16 + 90 + 24; // accommodates the "+" button at the bottom

  const getCardStyle = (block) => {
    const isDragging = activeDrag && activeDrag.blockId === block.id;
    const isResizing = activeResize && activeResize.blockId === block.id;

    let left = block.x * colWidth;
    let top = block.y * rowHeight;
    let width = block.w * colWidth - gap;
    let height = block.h * rowHeight - gap;

    if (isDragging) {
      left = activeDrag.currentLeft;
      top = activeDrag.currentTop;
    } else if (isResizing) {
      left = activeResize.currentLeft;
      top = activeResize.currentTop;
      width = activeResize.currentWidth;
      height = activeResize.currentHeight;
    }

    return {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      touchAction: 'none',
      opacity: draggedBlockId === block.id ? 0.35 : 1,
      cursor: isDragging ? 'grabbing' : 'grab'
    };
  };

  return (
    <div className={`bento-profile-wrapper ${isDark ? 'dark-mode-active' : ''}`} style={{ fontFamily: profileCardFont || 'var(--font-body)', minHeight: '100vh', paddingBottom: '120px', transition: 'background-color 0.3s' }}>
      <input type="file" ref={imageInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
      {/* 1. Header Navbar */}
      <header className="bento-nav-header">
        <div className="bento-nav-url" onClick={handleCopyLink} title="Copy profile URL" style={{ cursor: 'pointer' }}>
          <span>🔗</span> hiprofile.com/{getUsername('github', 'foxyman')}
        </div>
        <div className="bento-nav-actions">
          <button className="btn-bento-dashboard" id="btn-bento-dashboard-go" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
          <button className="btn-bento-share" onClick={handleCopyLink} title="Copy Profile URL">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Center content */}
      <div className="bento-content-container">


        {/* B. Overlapping White Profile Card */}
        <section className="bento-profile-details-card">
          <div className="bento-avatar-overlap">
            <AvatarDisplay avatar={avatar} />
          </div>
          <h2 className="bento-details-name">{name}</h2>
          <p className="bento-details-bio">{bio}</p>

        </section>

        {/* C. Bento Cards Grid */}
        <section
          ref={containerRef}
          className="bento-grid-layout-new"
          style={{
            height: `${totalContainerHeight}px`,
            '--bento-gap': `${gap}px`
          }}
        >
          {/* Snapping Grid Cell Placeholders Background */}
          <div className="bento-grid-background">
            {Array.from({ length: Math.max(0, maxPopulatedRow) * 4 }).map((_, i) => (
              <div key={i} className="bento-grid-cell-placeholder" />
            ))}
          </div>

          {/* Snap drag/resize preview outline */}
          {(dragPreview || (resizePreview && resizePreview.id === resizingBlockId)) && (
            <div
              className="bento-grid-preview-placeholder"
              style={{
                left: `${(dragPreview || resizePreview).x * colWidth}px`,
                top: `${(dragPreview || resizePreview).y * rowHeight}px`,
                width: `${(dragPreview || resizePreview).w * colWidth - gap}px`,
                height: `${(dragPreview || resizePreview).h * rowHeight - gap}px`
              }}
            >
              <div className="bento-grid-preview-inner">
                {(dragPreview || resizePreview).w} × {(dragPreview || resizePreview).h}
              </div>
            </div>
          )}

          {gridBlocks.map(block => {
            const isDraggingThis = draggedBlockId === block.id;
            const isResizingThis = resizingBlockId === block.id;
            const blockStyle = getCardStyle(block);

            if (block.type === 'location') {
              return (
                <div
                  key={block.id}
                  className={`bento-card-base bento-loc-card-new ${isDraggingThis ? 'dragging' : ''} ${isResizingThis ? 'resizing' : ''}`}
                  onPointerDown={(e) => handlePointerDownBlock(e, block)}
                  onPointerMove={(e) => handlePointerMoveBlock(e, block.id)}
                  onPointerUp={(e) => handlePointerUpBlock(e, block.id)}
                  style={blockStyle}
                >
                  <button className="delete-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteBlock(block.id); }} title="Delete Block">🗑️</button>
                  <div className="bento-loc-dot-new" />
                  <div className="bento-loc-text-new">{block.content}</div>
                  {renderResizeHandles(block)}
                </div>
              )
            }
            if (block.type === 'github') {
              return (
                <div
                  key={block.id}
                  className={`bento-card-base bento-git-card-new ${isDraggingThis ? 'dragging' : ''} ${isResizingThis ? 'resizing' : ''}`}
                  onPointerDown={(e) => handlePointerDownBlock(e, block)}
                  onPointerMove={(e) => handlePointerMoveBlock(e, block.id)}
                  onPointerUp={(e) => handlePointerUpBlock(e, block.id)}
                  style={blockStyle}
                >
                  <button className="delete-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteBlock(block.id); }} title="Delete Block">🗑️</button>
                  <div className="bento-git-left-new">
                    <div className="bento-git-icon-new">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                      </svg>
                    </div>
                    <div className="bento-git-details-new">
                      <div className="bento-git-title-new">{block.username}</div>
                      <div className="bento-git-sub-new">github.com</div>
                    </div>
                  </div>
                  <div className="bento-git-divider-new" />
                  <div className="bento-git-right-new" style={{ padding: 0, overflow: 'hidden' }}>
                    <img src="/assets/images/github_preview.png" alt="GitHub contributions" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  {renderResizeHandles(block)}
                </div>
              )
            }
            if (block.type === 'image') {
              return (
                <div
                  key={block.id}
                  className={`bento-card-base bento-img-card-new ${isDraggingThis ? 'dragging' : ''} ${isResizingThis ? 'resizing' : ''}`}
                  onPointerDown={(e) => handlePointerDownBlock(e, block)}
                  onPointerMove={(e) => handlePointerMoveBlock(e, block.id)}
                  onPointerUp={(e) => handlePointerUpBlock(e, block.id)}
                  style={{
                    ...blockStyle,
                    padding: 0
                  }}
                >
                  <button className="delete-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteBlock(block.id); }} title="Delete Block">🗑️</button>
                  <img src={block.url || '/assets/images/featured_brand_mockup.png'} alt="Project Portfolio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {renderResizeHandles(block)}
                </div>
              )
            }
            if (block.type === 'behance') {
              return (
                <div
                  key={block.id}
                  className={`bento-card-base bento-beh-card-new ${isDraggingThis ? 'dragging' : ''} ${isResizingThis ? 'resizing' : ''}`}
                  onPointerDown={(e) => handlePointerDownBlock(e, block)}
                  onPointerMove={(e) => handlePointerMoveBlock(e, block.id)}
                  onPointerUp={(e) => handlePointerUpBlock(e, block.id)}
                  style={blockStyle}
                >
                  <button className="delete-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteBlock(block.id); }} title="Delete Block">🗑️</button>
                  <div className="bento-beh-header-new">
                    <div className="bento-beh-brand-new">
                      <div className="bento-beh-icon-new">Bē</div>
                      <div className="bento-beh-text-new">
                        <div className="bento-beh-title-new">{block.title}</div>
                        <div className="bento-beh-sub-new">behance.net</div>
                      </div>
                    </div>
                    <button
                      className={`btn-bento-follow-new ${followed ? 'following' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFollowed(!followed)
                        toast(followed ? 'Unfollowed on Behance' : 'Following on Behance!')
                      }}
                    >
                      {followed ? '✓ Following' : '＋ Follow 158'}
                    </button>
                  </div>
                  <div className="bento-beh-bottom-card" style={{ background: '#111625', borderRadius: '16px' }}>
                    MEDSwift UI/UX Case Study
                  </div>
                  {renderResizeHandles(block)}
                </div>
              )
            }
            if (block.type === 'youtube') {
              return (
                <div
                  key={block.id}
                  className={`bento-card-base bento-yt-card-new ${isDraggingThis ? 'dragging' : ''} ${isResizingThis ? 'resizing' : ''}`}
                  onPointerDown={(e) => handlePointerDownBlock(e, block)}
                  onPointerMove={(e) => handlePointerMoveBlock(e, block.id)}
                  onPointerUp={(e) => handlePointerUpBlock(e, block.id)}
                  style={blockStyle}
                >
                  <button className="delete-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteBlock(block.id); }} title="Delete Block">🗑️</button>
                  <div className="bento-yt-left-new">
                    <div className="bento-yt-brand-new">
                      <div className="bento-yt-icon-new">▶</div>
                      <div className="bento-yt-text-new">
                        <div className="bento-yt-title-new">{block.title}</div>
                        <div className="bento-yt-sub-new">youtube.com</div>
                      </div>
                    </div>
                    <button
                      className={`btn-bento-sub-new ${subscribed ? 'subscribed' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSubscribed(!subscribed)
                        toast(subscribed ? 'Unsubscribed on YouTube' : 'Subscribe 694')
                      }}
                    >
                      {subscribed ? '✓ Subscribed' : 'Subscribe 694'}
                    </button>
                  </div>
                  <div className="bento-yt-right-new">
                    <div className="yt-grid-item-new" style={{ background: 'url(/assets/images/fintech_dashboard.png) center/cover' }} />
                    <div className="yt-grid-item-new" style={{ background: 'url(/assets/images/ecommerce_app.png) center/cover' }} />
                    <div className="yt-grid-item-new" style={{ background: 'url(/assets/images/design_system.png) center/cover' }} />
                    <div className="yt-grid-item-new" style={{ background: 'url(/assets/images/ar_glass.png) center/cover' }} />
                  </div>
                  {renderResizeHandles(block)}
                </div>
              )
            }
            if (block.type === 'custom-emoji') {
              return (
                <div
                  key={block.id}
                  className={`bento-card-base bento-block-emoji ${isDraggingThis ? 'dragging' : ''} ${isResizingThis ? 'resizing' : ''}`}
                  onPointerDown={(e) => handlePointerDownBlock(e, block)}
                  onPointerMove={(e) => handlePointerMoveBlock(e, block.id)}
                  onPointerUp={(e) => handlePointerUpBlock(e, block.id)}
                  style={blockStyle}
                >
                  <button className="delete-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteBlock(block.id); }} title="Delete Block">🗑️</button>
                  <button className="edit-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditBlock(block); }} title="Edit Block">✏️</button>
                  {block.emoji}
                  {renderResizeHandles(block)}
                </div>
              )
            }
            if (block.type === 'custom-text') {
              return (
                <div
                  key={block.id}
                  className={`bento-card-base bento-block-text ${isDraggingThis ? 'dragging' : ''} ${isResizingThis ? 'resizing' : ''}`}
                  onPointerDown={(e) => handlePointerDownBlock(e, block)}
                  onPointerMove={(e) => handlePointerMoveBlock(e, block.id)}
                  onPointerUp={(e) => handlePointerUpBlock(e, block.id)}
                  style={blockStyle}
                >
                  <button className="delete-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteBlock(block.id); }} title="Delete Block">🗑️</button>
                  <button className="edit-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditBlock(block); }} title="Edit Block">✏️</button>
                  {block.text}
                  {renderResizeHandles(block)}
                </div>
              )
            }
            if (block.type === 'custom-link') {
              const brandColor = getSocialBrandColor(block.url);
              return (
                <a
                  key={block.id}
                  href={block.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`bento-card-base bento-block-link ${isDraggingThis ? 'dragging' : ''} ${isResizingThis ? 'resizing' : ''}`}
                  onPointerDown={(e) => handlePointerDownBlock(e, block)}
                  onPointerMove={(e) => handlePointerMoveBlock(e, block.id)}
                  onPointerUp={(e) => handlePointerUpBlock(e, block.id)}
                  style={{
                    ...blockStyle,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '20px',
                    minHeight: '140px',
                    textDecoration: 'none'
                  }}
                >
                  <button className="delete-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteBlock(block.id); }} title="Delete Block">🗑️</button>
                  <button className="edit-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditBlock(block); }} title="Edit Block">✏️</button>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `${brandColor}15`,
                      color: brandColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0
                    }}>
                      {getSocialIcon(block.url, 20, brandColor)}
                    </div>
                    <span style={{ fontSize: '1.1rem', color: isDark ? '#94A3B8' : '#9CA3AF' }}>↗</span>
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                    <div className="bento-block-link-title" style={{ fontSize: '1.05rem', fontWeight: 800 }}>{block.title}</div>
                    <div className="bento-block-link-url" style={{ marginTop: 4, fontSize: '0.8rem', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {block.url.replace(/^https?:\/\/(www\.)?/, '')}
                    </div>
                  </div>
                  {renderResizeHandles(block)}
                </a>
              )
            }
            if (block.type === 'custom-checklist') {
              return (
                <div
                  key={block.id}
                  className={`bento-card-base bento-block-checklist ${isDraggingThis ? 'dragging' : ''} ${isResizingThis ? 'resizing' : ''}`}
                  onPointerDown={(e) => handlePointerDownBlock(e, block)}
                  onPointerMove={(e) => handlePointerMoveBlock(e, block.id)}
                  onPointerUp={(e) => handlePointerUpBlock(e, block.id)}
                  style={blockStyle}
                >
                  <button className="delete-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteBlock(block.id); }} title="Delete Block">🗑️</button>
                  <button className="edit-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditBlock(block); }} title="Edit Block">✏️</button>
                  <h4 className="checklist-title">{block.title}</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {block.items.map((item, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.95rem', color: isDark ? '#94A3B8' : '#4B5563', marginBottom: '8px', lineHeight: '1.4' }}>
                        <span style={{ color: '#3E66FB', fontWeight: 'bold' }}>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {renderResizeHandles(block)}
                </div>
              )
            }
            if (block.type === 'instagram') {
              return (
                <InstagramCard
                  key={block.id}
                  block={block}
                  isDraggingThis={isDraggingThis}
                  isResizingThis={isResizingThis}
                  blockStyle={blockStyle}
                  handleDeleteBlock={handleDeleteBlock}
                  handleEditBlock={handleEditBlock}
                  renderResizeHandles={renderResizeHandles}
                />
              )
            }
            if (block.type === 'github') {
              return (
                <GitHubCard
                  key={block.id}
                  block={block}
                  isDraggingThis={isDraggingThis}
                  isResizingThis={isResizingThis}
                  blockStyle={blockStyle}
                  handleDeleteBlock={handleDeleteBlock}
                  handleEditBlock={handleEditBlock}
                  renderResizeHandles={renderResizeHandles}
                />
              )
            }
            if (block.type === 'youtube') {
              return (
                <YouTubeCard
                  key={block.id}
                  block={block}
                  isDraggingThis={isDraggingThis}
                  isResizingThis={isResizingThis}
                  blockStyle={blockStyle}
                  handleDeleteBlock={handleDeleteBlock}
                  handleEditBlock={handleEditBlock}
                  renderResizeHandles={renderResizeHandles}
                />
              )
            }
            if (block.type === 'twitter') {
              return (
                <TwitterCard
                  key={block.id}
                  block={block}
                  isDraggingThis={isDraggingThis}
                  isResizingThis={isResizingThis}
                  blockStyle={blockStyle}
                  handleDeleteBlock={handleDeleteBlock}
                  handleEditBlock={handleEditBlock}
                  renderResizeHandles={renderResizeHandles}
                />
              )
            }
            if (block.type === 'linkedin') {
              return (
                <LinkedInCard
                  key={block.id}
                  block={block}
                  isDraggingThis={isDraggingThis}
                  isResizingThis={isResizingThis}
                  blockStyle={blockStyle}
                  handleDeleteBlock={handleDeleteBlock}
                  handleEditBlock={handleEditBlock}
                  renderResizeHandles={renderResizeHandles}
                />
              )
            }
            if (block.type === 'dribbble') {
              return (
                <DribbbleCard
                  key={block.id}
                  block={block}
                  isDraggingThis={isDraggingThis}
                  isResizingThis={isResizingThis}
                  blockStyle={blockStyle}
                  handleDeleteBlock={handleDeleteBlock}
                  handleEditBlock={handleEditBlock}
                  renderResizeHandles={renderResizeHandles}
                />
              )
            }
            return null
          })}

          {/* Dotted "+" Card */}
          <div
            className="bento-add-block-btn"
            onClick={() => openDialog('select-tool')}
            style={{
              cursor: 'pointer',
              position: 'absolute',
              left: 0,
              top: `${gridHeight + 16}px`,
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <span style={{ fontSize: '1.8rem' }}>＋</span>
            <span>Click here to add a block</span>
          </div>
        </section>

      </div>

      {/* 4. Bottom Toolbar palette */}
      <div className="bento-bottom-actions">
        <div className="bento-quick-left">
          <button className="btn-bento-quick" id="btn-bento-theme-toggle" onClick={toggleTheme} title="Toggle Dark/Light Mode">
            {isDark ? '☀️' : '🌙'}
          </button>
          <button className="btn-bento-quick btn-quick-share-text" onClick={handleCopyLink} title="Share Profile">
            <span>📤</span> Share my page
          </button>
          <button className="btn-bento-quick" onClick={() => toast('No new messages 💬')} title="Inbox">
            💬
          </button>
          <button className="btn-bento-quick" onClick={() => navigate('/')} title="Explore Home">
            🧭
          </button>
        </div>
      </div>

      {/* Custom dialog modal overlay */}
      {activeDialog && (
        <div className="bento-dialog-overlay" onClick={closeDialog}>
          <div className="bento-dialog-card" onClick={e => e.stopPropagation()} style={activeDialog === 'select-tool' ? { maxWidth: '500px' } : {}}>
            <h3 className="bento-dialog-title" style={{ fontFamily: 'var(--font-heading)' }}>
              {activeDialog === 'select-tool' && 'Add Block / Tool'}
              {activeDialog === 'emoji' && (editingBlockId ? 'Edit Emoji Block' : 'Add Emoji Block')}
              {activeDialog === 'link' && (editingBlockId ? 'Edit Link Block' : 'Add Link Block')}
              {activeDialog === 'text' && (editingBlockId ? 'Edit Text Block' : 'Add Text Block')}
              {activeDialog === 'checklist' && (editingBlockId ? 'Edit List Block' : 'Add List Block')}
              {activeDialog === 'instagram' && (editingBlockId ? 'Edit Instagram Block' : 'Add Instagram Block')}
            </h3>

            {activeDialog === 'select-tool' && (
              <div className="bento-tool-select-grid">
                <button className="tool-select-item" onClick={() => openDialog('emoji')} title="Add Emoji Block">
                  <span className="tool-select-icon">😊</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">Emoji</span>
                    <span className="tool-select-desc">Add visual emoji block</span>
                  </div>
                </button>
                <button className="tool-select-item" onClick={() => openDialog('link')} title="Add Link Block">
                  <span className="tool-select-icon">🔗</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">Link</span>
                    <span className="tool-select-desc">Add custom redirect URL</span>
                  </div>
                </button>
                <button className="tool-select-item" onClick={() => openDialog('text')} title="Add Text Block">
                  <span className="tool-select-icon">Ｔ</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">Text</span>
                    <span className="tool-select-desc">Add paragraph text card</span>
                  </div>
                </button>
                <button className="tool-select-item" onClick={() => openDialog('checklist')} title="Add List Block">
                  <span className="tool-select-icon">📋</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">Checklist</span>
                    <span className="tool-select-desc">Create task checkbox list</span>
                  </div>
                </button>
                <button className="tool-select-item" onClick={() => { imageInputRef.current?.click(); closeDialog(); }} title="Add Image Card">
                  <span className="tool-select-icon">🖼️</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">Image Card</span>
                    <span className="tool-select-desc">Upload custom image file</span>
                  </div>
                </button>
                <button className="tool-select-item" onClick={() => { handleToggleGridSpacing(); closeDialog(); }} title="Toggle Spacing">
                  <span className="tool-select-icon">田</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">Grid Spacing</span>
                    <span className="tool-select-desc">Toggle layout gaps</span>
                  </div>
                </button>

                <button className="tool-select-item" onClick={() => { handleToggleLayoutMode(); closeDialog(); }} title="Toggle Layout Mode">
                  <span className="tool-select-icon">{freeGridMode ? '🎨' : '🧲'}</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">Layout: {freeGridMode ? 'Free Grid' : 'Auto-Compact'}</span>
                    <span className="tool-select-desc">{freeGridMode ? 'Switch to snapping gravity' : 'Switch to placing anywhere'}</span>
                  </div>
                </button>

                <button className="tool-select-item" onClick={() => { handleAddAIBlock(); closeDialog(); }} title="Add AI Block">
                  <span className="tool-select-icon">✨</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">AI Quote</span>
                    <span className="tool-select-desc">Generate AI quote card</span>
                  </div>
                </button>

                <button className="tool-select-item" onClick={() => openDialog('instagram')} title="Add Instagram Block">
                  <span className="tool-select-icon">📸</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">Instagram</span>
                    <span className="tool-select-desc">Show live followers & posts</span>
                  </div>
                </button>
                <button className="tool-select-item" onClick={() => { handleAddSocialBlock('github'); closeDialog(); }} title="Add GitHub Block">
                  <span className="tool-select-icon">💻</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">GitHub</span>
                    <span className="tool-select-desc">Show repos & stats</span>
                  </div>
                </button>
                <button className="tool-select-item" onClick={() => { handleAddSocialBlock('youtube'); closeDialog(); }} title="Add YouTube Block">
                  <span className="tool-select-icon">🎥</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">YouTube</span>
                    <span className="tool-select-desc">Show stats & videos</span>
                  </div>
                </button>
                <button className="tool-select-item" onClick={() => { handleAddSocialBlock('twitter'); closeDialog(); }} title="Add Twitter Block">
                  <span className="tool-select-icon">🐦</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">Twitter / X</span>
                    <span className="tool-select-desc">Show tweets & stats</span>
                  </div>
                </button>
                <button className="tool-select-item" onClick={() => { handleAddSocialBlock('linkedin'); closeDialog(); }} title="Add LinkedIn Block">
                  <span className="tool-select-icon">👥</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">LinkedIn</span>
                    <span className="tool-select-desc">Show profile link</span>
                  </div>
                </button>
                <button className="tool-select-item" onClick={() => { handleAddSocialBlock('dribbble'); closeDialog(); }} title="Add Dribbble Block">
                  <span className="tool-select-icon">🎨</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">Dribbble</span>
                    <span className="tool-select-desc">Show shots & stats</span>
                  </div>
                </button>
              </div>
            )}

            {activeDialog === 'emoji' && (
              <input
                type="text"
                id="bento-dialog-input-1"
                maxLength="2"
                className="bento-dialog-input"
                placeholder="Enter an emoji (e.g. 🚀)"
                value={dialogInput1}
                onChange={e => setDialogInput1(e.target.value)}
              />
            )}
            {activeDialog === 'instagram' && (
              <input
                type="text"
                id="bento-dialog-input-1"
                className="bento-dialog-input"
                placeholder="Instagram Username (e.g. nasa)"
                value={dialogInput1}
                onChange={e => setDialogInput1(e.target.value)}
              />
            )}
            {activeDialog === 'text' && (
              <textarea
                id="bento-dialog-input-1"
                className="bento-dialog-input"
                style={{ height: '100px', padding: '12px', resize: 'none' }}
                placeholder="Enter your message..."
                value={dialogInput1}
                onChange={e => setDialogInput1(e.target.value)}
              />
            )}
            {activeDialog === 'link' && (
              <>
                <input
                  type="text"
                  id="bento-dialog-input-1"
                  className="bento-dialog-input"
                  placeholder="Link Title (e.g. My Website)"
                  value={dialogInput1}
                  onChange={e => setDialogInput1(e.target.value)}
                />
                <input
                  type="text"
                  id="bento-dialog-input-2"
                  className="bento-dialog-input"
                  placeholder="URL (e.g. https://example.com)"
                  value={dialogInput2}
                  onChange={e => setDialogInput2(e.target.value)}
                />
              </>
            )}
            {activeDialog === 'checklist' && (
              <>
                <input
                  type="text"
                  className="bento-dialog-input"
                  placeholder="List Title (e.g. My List)"
                  value={listTitle}
                  onChange={e => setListTitle(e.target.value)}
                  style={{ marginBottom: '16px' }}
                />
                <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
                  {listItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="list-editor-item"
                      draggable={true}
                      onDragStart={(e) => handleDragStartItem(e, idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDropItem(e, idx)}
                      style={{
                        opacity: draggedItemIndex === idx ? 0.4 : 1,
                        cursor: 'grab'
                      }}
                    >
                      <span style={{ color: '#3E66FB', fontSize: '1.2rem', fontWeight: 'bold', marginLeft: '6px', cursor: 'grab', userSelect: 'none' }}>•</span>
                      <input
                        type="text"
                        className="bento-dialog-input"
                        style={{ marginBottom: 0, flex: 1, height: '36px', borderRadius: '8px', border: '1.5px solid #E2E8F0' }}
                        placeholder={`Item ${idx + 1}`}
                        value={item}
                        onChange={(e) => {
                          const updated = [...listItems];
                          updated[idx] = e.target.value;
                          setListItems(updated);
                        }}
                        ref={idx === listItems.length - 1 ? lastItemRef : null}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = listItems.filter((_, itemIdx) => itemIdx !== idx);
                          setListItems(updated);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          fontSize: '1.2rem',
                          padding: '0 8px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                        title="Delete Item"
                      >
                        —
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setListItems([...listItems, '']);
                    setShouldFocusLast(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'none',
                    border: '1.5px dashed #3E66FB',
                    color: '#3E66FB',
                    borderRadius: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    marginBottom: '16px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  + Add Item
                </button>
              </>
            )}

            {/* Block Size selector has been removed in favor of drag-to-resize handles */}

            <div className="bento-dialog-actions" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
              {editingBlockId ? (
                <button
                  className="btn-bento-dialog-delete"
                  style={{
                    backgroundColor: '#EF4444',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    marginRight: 'auto'
                  }}
                  onClick={() => handleDeleteBlock(editingBlockId)}
                >
                  Delete Block
                </button>
              ) : <div />}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-bento-dialog-cancel" id="btn-bento-dialog-cancel" onClick={closeDialog}>Cancel</button>
                {activeDialog !== 'select-tool' && (
                  <button className="btn-bento-dialog-submit" id="btn-bento-dialog-submit" onClick={handleDialogSubmit}>
                    {editingBlockId ? 'Save Changes' : 'Add to Page'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}

function InstagramCard({ block, isDraggingThis, isResizingThis, blockStyle, handleDeleteBlock, handleEditBlock, renderResizeHandles }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!block.username) {
      setLoading(false);
      setError('No username provided');
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`http://localhost:3001/api/instagram/profile/${block.username}`)
      .then(res => {
        if (!res.ok) throw new Error('Profile not found');
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [block.username]);

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num;
  };

  return (
    <div
      className={`bento-card-base bento-insta-card-new ${isDraggingThis ? 'dragging' : ''} ${isResizingThis ? 'resizing' : ''}`}
      style={blockStyle}
    >
      <button className="delete-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteBlock(block.id); }} title="Delete Block">🗑️</button>
      <button className="edit-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditBlock(block); }} title="Edit Block">✏️</button>

      {loading && (
        <div className="bento-insta-loading">
          <div className="bento-insta-shimmer header" />
          <div className="bento-insta-shimmer stats" />
          <div className="bento-insta-shimmer grid" />
        </div>
      )}

      {!loading && error && (
        <div className="bento-insta-error">
          <div className="bento-insta-error-icon">📸</div>
          <div className="bento-insta-error-text">@{block.username || 'instagram'}</div>
          <div className="bento-insta-error-sub">No live data. Connect server & check API key.</div>
        </div>
      )}

      {!loading && !error && data && data.success && data.profile && (
        (() => {
          const profile = data.profile;
          return (
            <div className="bento-insta-content">
              <div className="bento-insta-header">
                <div className="bento-insta-profile-info">
                  <img src={profile.profilePicture || '/assets/images/foxy_avatar.png'} alt={profile.fullName} className="bento-insta-avatar" referrerPolicy="no-referrer" />
                  <div className="bento-insta-names">
                    <a href={`https://instagram.com/${profile.username}`} target="_blank" rel="noopener noreferrer" className="bento-insta-fullname">
                      {profile.fullName}
                    </a>
                    <span className="bento-insta-handle">@{profile.username}</span>
                  </div>
                </div>
                <a href={`https://instagram.com/${profile.username}`} target="_blank" rel="noopener noreferrer" className="bento-insta-follow-btn">
                  Follow
                </a>
              </div>

              {profile.biography && (
                <p className="bento-insta-bio" style={{ fontSize: '0.82rem', color: '#64748B', margin: '8px 0 2px 0', textAlign: 'left', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {profile.biography}
                </p>
              )}

              <div className="bento-insta-stats">
                <div className="bento-insta-stat-item">
                  <span className="bento-insta-stat-value">{formatNumber(profile.followersCount)}</span>
                  <span className="bento-insta-stat-label">followers</span>
                </div>
                <div className="bento-insta-stat-item">
                  <span className="bento-insta-stat-value">{formatNumber(profile.followingCount)}</span>
                  <span className="bento-insta-stat-label">following</span>
                </div>
                <div className="bento-insta-stat-item">
                  <span className="bento-insta-stat-value">{formatNumber(profile.postsCount)}</span>
                  <span className="bento-insta-stat-label">posts</span>
                </div>
              </div>

              {profile.recentPosts && profile.recentPosts.length > 0 && (
                <div className="bento-insta-posts-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  {profile.recentPosts.slice(0, 3).map(post => (
                    <a key={post.id} href={post.postUrl} target="_blank" rel="noopener noreferrer" className="bento-insta-post-link">
                      <img src={post.imageUrl} alt={post.caption || 'Instagram post'} className="bento-insta-post-img" referrerPolicy="no-referrer" />
                      <div className="bento-insta-post-hover">
                        <span>❤️ {formatNumber(post.likesCount)}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })()
      )}

      {renderResizeHandles(block)}
    </div>
  );
}

function GitHubCard({ block, isDraggingThis, isResizingThis, blockStyle, handleDeleteBlock, handleEditBlock, renderResizeHandles }) {
  const { socialLinks } = useOnboarding();
  const username = socialLinks?.github || '';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`http://localhost:3001/api/social/github/${username}`)
      .then(res => {
        if (!res.ok) throw new Error('GitHub profile not found');
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [username]);

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num;
  };

  return (
    <div
      className={`bento-card-base bento-insta-card-new ${isDraggingThis ? 'dragging' : ''} ${isResizingThis ? 'resizing' : ''}`}
      style={{ ...blockStyle, display: 'flex', flexDirection: 'column' }}
    >
      <button className="delete-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteBlock(block.id); }} title="Delete Block">🗑️</button>

      {!username && (
        <div className="bento-insta-error" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
          <span style={{ fontSize: '2.5rem', marginBottom: '8px' }}>💻</span>
          <p style={{ fontSize: '0.9rem', color: '#64748B', textAlign: 'center', fontWeight: 'bold' }}>Connect your GitHub account from the Accounts page.</p>
        </div>
      )}

      {username && loading && (
        <div className="bento-insta-loading">
          <div className="bento-insta-shimmer header" />
          <div className="bento-insta-shimmer stats" />
          <div className="bento-insta-shimmer grid" />
        </div>
      )}

      {username && !loading && error && (
        <div className="bento-insta-error">
          <div className="bento-insta-error-icon">💻</div>
          <div className="bento-insta-error-text">@{username}</div>
          <div className="bento-insta-error-sub">Failed to load GitHub data.</div>
        </div>
      )}

      {username && !loading && !error && data && data.success && data.profile && (
        (() => {
          const profile = data.profile;
          return (
            <div className="bento-insta-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="bento-insta-header">
                <div className="bento-insta-profile-info">
                  <img src={profile.avatarUrl || '/assets/images/foxy_avatar.png'} alt={profile.name} className="bento-insta-avatar" referrerPolicy="no-referrer" />
                  <div className="bento-insta-names">
                    <a href={`https://github.com/${profile.username}`} target="_blank" rel="noopener noreferrer" className="bento-insta-fullname">
                      {profile.name}
                    </a>
                    <span className="bento-insta-handle">@{profile.username}</span>
                  </div>
                </div>
                <a href={`https://github.com/${profile.username}`} target="_blank" rel="noopener noreferrer" className="bento-insta-follow-btn" style={{ background: '#24292F', color: '#FFF' }}>
                  Follow
                </a>
              </div>

              {profile.bio && (
                <p className="bento-insta-bio" style={{ fontSize: '0.82rem', color: '#64748B', margin: '8px 0 2px 0', textAlign: 'left', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {profile.bio}
                </p>
              )}

              <div className="bento-insta-stats" style={{ margin: '8px 0 12px 0' }}>
                <div className="bento-insta-stat-item">
                  <span className="bento-insta-stat-value">{formatNumber(profile.followersCount)}</span>
                  <span className="bento-insta-stat-label">followers</span>
                </div>
                <div className="bento-insta-stat-item">
                  <span className="bento-insta-stat-value">{formatNumber(profile.followingCount)}</span>
                  <span className="bento-insta-stat-label">following</span>
                </div>
                <div className="bento-insta-stat-item">
                  <span className="bento-insta-stat-value">{formatNumber(profile.reposCount)}</span>
                  <span className="bento-insta-stat-label">repos</span>
                </div>
              </div>

              {profile.recentRepos && profile.recentRepos.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto' }}>
                  {profile.recentRepos.slice(0, 3).map((repo, idx) => (
                    <a key={idx} href={repo.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', padding: '8px 10px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', textDecoration: 'none', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{repo.name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>⭐ {formatNumber(repo.stars)}</span>
                      </div>
                      {repo.description && (
                        <span style={{ fontSize: '0.75rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{repo.description}</span>
                      )}
                      {repo.language && (
                        <span style={{ fontSize: '0.7rem', color: '#3B82F6', fontWeight: '600', marginTop: '2px' }}>● {repo.language}</span>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })()
      )}

      {renderResizeHandles(block)}
    </div>
  );
}

function YouTubeCard({ block, isDraggingThis, isResizingThis, blockStyle, handleDeleteBlock, handleEditBlock, renderResizeHandles }) {
  const { socialLinks } = useOnboarding();
  const username = socialLinks?.youtube || '';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`http://localhost:3001/api/social/youtube/${username}`)
      .then(res => res.json().then(json => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (!ok) throw new Error(json.error || 'YouTube channel not found');
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [username]);

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num;
  };

  return (
    <div
      className={`bento-card-base bento-insta-card-new ${isDraggingThis ? 'dragging' : ''} ${isResizingThis ? 'resizing' : ''}`}
      style={{ ...blockStyle, display: 'flex', flexDirection: 'column' }}
    >
      <button className="delete-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteBlock(block.id); }} title="Delete Block">🗑️</button>

      {!username && (
        <div className="bento-insta-error" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
          <span style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎥</span>
          <p style={{ fontSize: '0.9rem', color: '#64748B', textAlign: 'center', fontWeight: 'bold' }}>Connect your YouTube account from the Accounts page.</p>
        </div>
      )}

      {username && loading && (
        <div className="bento-insta-loading">
          <div className="bento-insta-shimmer header" />
          <div className="bento-insta-shimmer stats" />
          <div className="bento-insta-shimmer grid" />
        </div>
      )}

      {username && !loading && error && (
        <div className="bento-insta-error">
          <div className="bento-insta-error-icon">🎥</div>
          <div className="bento-insta-error-text">@{username}</div>
          <div className="bento-insta-error-sub">{error}</div>
        </div>
      )}

      {username && !loading && !error && data && data.success && data.profile && (
        (() => {
          const profile = data.profile;
          return (
            <div className="bento-insta-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="bento-insta-header">
                <div className="bento-insta-profile-info">
                  <img src={profile.profilePicture || '/assets/images/foxy_avatar.png'} alt={profile.channelName} className="bento-insta-avatar" referrerPolicy="no-referrer" />
                  <div className="bento-insta-names">
                    <a href={profile.handle.startsWith('http') ? profile.handle : `https://youtube.com/${profile.handle}`} target="_blank" rel="noopener noreferrer" className="bento-insta-fullname">
                      {profile.channelName}
                    </a>
                    <span className="bento-insta-handle">{profile.handle}</span>
                  </div>
                </div>
                <a href={profile.handle.startsWith('http') ? profile.handle : `https://youtube.com/${profile.handle}`} target="_blank" rel="noopener noreferrer" className="bento-insta-follow-btn" style={{ background: '#FF0000', color: '#FFF' }}>
                  Subscribe
                </a>
              </div>

              {profile.description && (
                <p className="bento-insta-bio" style={{ fontSize: '0.82rem', color: '#64748B', margin: '8px 0 2px 0', textAlign: 'left', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {profile.description}
                </p>
              )}

              <div className="bento-insta-stats" style={{ margin: '8px 0 12px 0' }}>
                <div className="bento-insta-stat-item">
                  <span className="bento-insta-stat-value">{formatNumber(profile.subscribersCount)}</span>
                  <span className="bento-insta-stat-label">subscribers</span>
                </div>
                <div className="bento-insta-stat-item">
                  <span className="bento-insta-stat-value">{formatNumber(profile.videoCount)}</span>
                  <span className="bento-insta-stat-label">videos</span>
                </div>
                <div className="bento-insta-stat-item">
                  <span className="bento-insta-stat-value">{formatNumber(profile.viewCount)}</span>
                  <span className="bento-insta-stat-label">views</span>
                </div>
              </div>

              {profile.recentVideos && profile.recentVideos.length > 0 && (
                <div className="bento-insta-posts-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 'auto' }}>
                  {profile.recentVideos.slice(0, 3).map((video, idx) => (
                    <a key={idx} href={video.url} target="_blank" rel="noopener noreferrer" className="bento-insta-post-link" title={video.title}>
                      <img src={video.thumbnailUrl} alt={video.title} className="bento-insta-post-img" referrerPolicy="no-referrer" />
                      <div className="bento-insta-post-hover" style={{ padding: '4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>▶️ Play</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })()
      )}

      {renderResizeHandles(block)}
    </div>
  );
}

function TwitterCard({ block, isDraggingThis, isResizingThis, blockStyle, handleDeleteBlock, handleEditBlock, renderResizeHandles }) {
  const { socialLinks } = useOnboarding();
  const username = socialLinks?.twitter || '';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`http://localhost:3001/api/social/twitter/${username}`)
      .then(res => {
        if (!res.ok) throw new Error('Twitter profile error');
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [username]);

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num;
  };

  return (
    <div
      className={`bento-card-base bento-insta-card-new ${isDraggingThis ? 'dragging' : ''} ${isResizingThis ? 'resizing' : ''}`}
      style={{ ...blockStyle, display: 'flex', flexDirection: 'column' }}
    >
      <button className="delete-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteBlock(block.id); }} title="Delete Block">🗑️</button>

      {!username && (
        <div className="bento-insta-error" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
          <span style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🐦</span>
          <p style={{ fontSize: '0.9rem', color: '#64748B', textAlign: 'center', fontWeight: 'bold' }}>Connect your Twitter / X account from the Accounts page.</p>
        </div>
      )}

      {username && loading && (
        <div className="bento-insta-loading">
          <div className="bento-insta-shimmer header" />
          <div className="bento-insta-shimmer stats" />
          <div className="bento-insta-shimmer grid" />
        </div>
      )}

      {username && !loading && !error && data && (
        (() => {
          if (!data.success && data.errorType === 'UNAVAILABLE') {
            return (
              <div className="bento-insta-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="bento-insta-header">
                  <div className="bento-insta-profile-info">
                    <div className="bento-insta-avatar" style={{ background: '#1DA1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                      X
                    </div>
                    <div className="bento-insta-names">
                      <a href={`https://x.com/${username}`} target="_blank" rel="noopener noreferrer" className="bento-insta-fullname">
                        Twitter / X Profile
                      </a>
                      <span className="bento-insta-handle">@{username}</span>
                    </div>
                  </div>
                  <a href={`https://x.com/${username}`} target="_blank" rel="noopener noreferrer" className="bento-insta-follow-btn" style={{ background: '#0F172A', color: '#FFF' }}>
                    View
                  </a>
                </div>
                <div style={{ marginTop: 'auto', marginBottom: 'auto', padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0, lineHeight: '1.4' }}>
                    Twitter/X API stats & posts are currently unavailable due to platform access restrictions.
                  </p>
                </div>
              </div>
            );
          }

          const profile = data.profile;
          return (
            <div className="bento-insta-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="bento-insta-header">
                <div className="bento-insta-profile-info">
                  <img src={profile.profilePicture || '/assets/images/foxy_avatar.png'} alt={profile.displayName} className="bento-insta-avatar" referrerPolicy="no-referrer" />
                  <div className="bento-insta-names">
                    <a href={`https://x.com/${profile.username}`} target="_blank" rel="noopener noreferrer" className="bento-insta-fullname">
                      {profile.displayName}
                    </a>
                    <span className="bento-insta-handle">@{profile.username}</span>
                  </div>
                </div>
                <a href={`https://x.com/${profile.username}`} target="_blank" rel="noopener noreferrer" className="bento-insta-follow-btn" style={{ background: '#0F172A', color: '#FFF' }}>
                  Follow
                </a>
              </div>

              {profile.bio && (
                <p className="bento-insta-bio" style={{ fontSize: '0.82rem', color: '#64748B', margin: '8px 0 2px 0', textAlign: 'left', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {profile.bio}
                </p>
              )}

              <div className="bento-insta-stats" style={{ margin: '8px 0 12px 0', justifyContent: 'space-around' }}>
                <div className="bento-insta-stat-item">
                  <span className="bento-insta-stat-value">{formatNumber(profile.followersCount)}</span>
                  <span className="bento-insta-stat-label">followers</span>
                </div>
                <div className="bento-insta-stat-item">
                  <span className="bento-insta-stat-value">{formatNumber(profile.followingCount)}</span>
                  <span className="bento-insta-stat-label">following</span>
                </div>
                <div className="bento-insta-stat-item">
                  <span className="bento-insta-stat-value">{formatNumber(profile.postCount)}</span>
                  <span className="bento-insta-stat-label">posts</span>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {renderResizeHandles(block)}
    </div>
  );
}

function LinkedInCard({ block, isDraggingThis, isResizingThis, blockStyle, handleDeleteBlock, handleEditBlock, renderResizeHandles }) {
  const { socialLinks } = useOnboarding();
  const username = socialLinks?.linkedin || '';

  const profileUrl = username.startsWith('http') ? username : `https://www.linkedin.com/in/${username}`;
  const displayName = username.split('/').filter(Boolean).pop() || username;

  return (
    <div
      className={`bento-card-base bento-insta-card-new ${isDraggingThis ? 'dragging' : ''} ${isResizingThis ? 'resizing' : ''}`}
      style={{ ...blockStyle, display: 'flex', flexDirection: 'column' }}
    >
      <button className="delete-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteBlock(block.id); }} title="Delete Block">🗑️</button>

      {!username && (
        <div className="bento-insta-error" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
          <span style={{ fontSize: '2.5rem', marginBottom: '8px' }}>👥</span>
          <p style={{ fontSize: '0.9rem', color: '#64748B', textAlign: 'center', fontWeight: 'bold' }}>Connect your LinkedIn account from the Accounts page.</p>
        </div>
      )}

      {username && (
        <div className="bento-insta-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="bento-insta-header">
            <div className="bento-insta-profile-info">
              <div className="bento-insta-avatar" style={{ background: '#0077B5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                in
              </div>
              <div className="bento-insta-names">
                <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="bento-insta-fullname">
                  LinkedIn Profile
                </a>
                <span className="bento-insta-handle">@{displayName}</span>
              </div>
            </div>
            <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="bento-insta-follow-btn" style={{ background: '#0077B5', color: '#FFF' }}>
              Connect
            </a>
          </div>
          <div style={{ marginTop: 'auto', marginBottom: 'auto', padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0, lineHeight: '1.4' }}>
              View professional experience, education, connections, and posts on LinkedIn.
            </p>
          </div>
        </div>
      )}

      {renderResizeHandles(block)}
    </div>
  );
}

function DribbbleCard({ block, isDraggingThis, isResizingThis, blockStyle, handleDeleteBlock, handleEditBlock, renderResizeHandles }) {
  const { socialLinks } = useOnboarding();
  const username = socialLinks?.dribbble || '';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`http://localhost:3001/api/social/dribbble/${username}`)
      .then(res => {
        if (!res.ok) throw new Error('Dribbble profile not found');
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [username]);

  const formatNumber = (num) => {
    if (!num) return '0';
    if (typeof num === 'string') return num;
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num;
  };

  return (
    <div
      className={`bento-card-base bento-insta-card-new ${isDraggingThis ? 'dragging' : ''} ${isResizingThis ? 'resizing' : ''}`}
      style={{ ...blockStyle, display: 'flex', flexDirection: 'column' }}
    >
      <button className="delete-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteBlock(block.id); }} title="Delete Block">🗑️</button>

      {!username && (
        <div className="bento-insta-error" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
          <span style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎨</span>
          <p style={{ fontSize: '0.9rem', color: '#64748B', textAlign: 'center', fontWeight: 'bold' }}>Connect your Dribbble account from the Accounts page.</p>
        </div>
      )}

      {username && loading && (
        <div className="bento-insta-loading">
          <div className="bento-insta-shimmer header" />
          <div className="bento-insta-shimmer stats" />
          <div className="bento-insta-shimmer grid" />
        </div>
      )}

      {username && !loading && error && (
        <div className="bento-insta-error">
          <div className="bento-insta-error-icon">🎨</div>
          <div className="bento-insta-error-text">@{username}</div>
          <div className="bento-insta-error-sub">Failed to load Dribbble data.</div>
        </div>
      )}

      {username && !loading && !error && data && data.success && data.profile && (
        (() => {
          const profile = data.profile;
          return (
            <div className="bento-insta-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="bento-insta-header">
                <div className="bento-insta-profile-info">
                  <img src={profile.profilePicture || '/assets/images/foxy_avatar.png'} alt={profile.name} className="bento-insta-avatar" referrerPolicy="no-referrer" />
                  <div className="bento-insta-names">
                    <a href={`https://dribbble.com/${profile.username}`} target="_blank" rel="noopener noreferrer" className="bento-insta-fullname">
                      {profile.name}
                    </a>
                    <span className="bento-insta-handle">@{profile.username}</span>
                  </div>
                </div>
                <a href={`https://dribbble.com/${profile.username}`} target="_blank" rel="noopener noreferrer" className="bento-insta-follow-btn" style={{ background: '#EA4C89', color: '#FFF' }}>
                  Follow
                </a>
              </div>

              {profile.bio && (
                <p className="bento-insta-bio" style={{ fontSize: '0.82rem', color: '#64748B', margin: '8px 0 2px 0', textAlign: 'left', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {profile.bio}
                </p>
              )}

              <div className="bento-insta-stats" style={{ margin: '8px 0 12px 0', justifyContent: 'space-around' }}>
                <div className="bento-insta-stat-item">
                  <span className="bento-insta-stat-value">{formatNumber(profile.followersCount)}</span>
                  <span className="bento-insta-stat-label">followers</span>
                </div>
                <div className="bento-insta-stat-item">
                  <span className="bento-insta-stat-value">{formatNumber(profile.followingCount)}</span>
                  <span className="bento-insta-stat-label">following</span>
                </div>
                <div className="bento-insta-stat-item">
                  <span className="bento-insta-stat-value">{formatNumber(profile.shotsCount)}</span>
                  <span className="bento-insta-stat-label">shots loaded</span>
                </div>
              </div>

              {profile.recentShots && profile.recentShots.length > 0 && (
                <div className="bento-insta-posts-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 'auto' }}>
                  {profile.recentShots.slice(0, 3).map((shot, idx) => (
                    <a key={idx} href={shot.url} target="_blank" rel="noopener noreferrer" className="bento-insta-post-link" title={shot.title}>
                      <img src={shot.imageUrl} alt={shot.title} className="bento-insta-post-img" referrerPolicy="no-referrer" />
                      <div className="bento-insta-post-hover" style={{ padding: '4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>👁️ View</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })()
      )}

      {renderResizeHandles(block)}
    </div>
  );
}


