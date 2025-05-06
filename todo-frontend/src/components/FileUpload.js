import React from "react";
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Avatar,
  Paper,
  Divider,
  Tooltip,
  Alert,
  Chip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import AttachFileIcon from '@mui/icons-material/AttachFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';

const FileUpload = ({
  todoId,
  attachments,
  onFileUpload,
  onFileDelete,
  uploading,
  uploadError,
  fileInputRef,
}) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG, PNG, and PDF files are allowed");
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }

    onFileUpload(file);
  };

  const getFileIcon = (mimetype, attachment) => {
    const thumbnailBoxStyle = {
      width: 56,
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#fff",
      borderRadius: 2,
      border: "1px solid rgba(0,0,0,0.08)",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      mr: 2,
      overflow: 'hidden',
      position: 'relative',
      transition: 'transform 0.2s ease',
      '&:hover': {
        transform: 'scale(1.05)',
      }
    };
    
    if (mimetype === "application/pdf") {
      return (
        <Box sx={thumbnailBoxStyle}>
          <PictureAsPdfIcon sx={{ fontSize: 32, color: "#e53935" }} />
        </Box>
      );
    } else if (mimetype.startsWith("image/")) {
      const imageUrl = attachment.cloudinaryUrl || attachment.url;
      return (
        <Box sx={thumbnailBoxStyle}>
          <Avatar
            variant="square"
            src={imageUrl}
            sx={{ width: '100%', height: '100%' }}
            alt="Thumbnail"
          />
        </Box>
      );
    }
    return (
      <Box sx={thumbnailBoxStyle}>
        <ImageIcon sx={{ fontSize: 32, color: "#42a5f5" }} />
      </Box>
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3
        }}
      >
        <input
          accept="image/*,.pdf"
          style={{ display: "none" }}
          id={`file-upload-${todoId}`}
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          ref={fileInputRef}
        />
        <label htmlFor={`file-upload-${todoId}`} style={{ display: 'block', width: '100%' }}>
          <Button
            component="span"
            variant="outlined"
            fullWidth
            startIcon={
              uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />
            }
            disabled={uploading}
            sx={{ 
              py: 1.2,
              borderColor: 'rgba(0, 0, 0, 0.23)',
              color: 'text.primary',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
                borderColor: 'text.primary'
              }
            }}
          >
            {uploading ? "Uploading..." : "Upload Attachment"}
          </Button>
        </label>

        <Typography variant="caption" color="text.secondary" sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          Supports JPG, PNG, PDF (max 5MB)
        </Typography>
      </Box>

      {uploadError && (
        <Alert 
          severity="error" 
          sx={{ mt: 0, mb: 3, borderRadius: 1 }}
        >
          {uploadError}
        </Alert>
      )}
      
      {attachments && attachments.length > 0 ? (
        <Paper 
          variant="outlined" 
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            borderColor: 'rgba(0, 0, 0, 0.12)'
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 2, 
              bgcolor: 'rgba(0, 0, 0, 0.03)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
            }}
          >
            <AttachFileIcon sx={{ mr: 1.5, color: 'text.secondary', transform: 'rotate(45deg)' }} />
            <Typography variant="subtitle1" fontWeight="medium">
              Attachments ({attachments.length})
            </Typography>
          </Box>
          
          <List sx={{ py: 0 }}>
            {attachments.map((attachment, index) => (
              <React.Fragment key={attachment._id}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  sx={{ 
                    py: 1.5, 
                    px: 2,
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.01)'
                    }
                  }}
                  secondaryAction={
                    <Box>
                      <Tooltip title="View">
                        <IconButton
                          edge="end"
                          aria-label="view"
                          href={attachment.mimetype === "application/pdf" 
                            ? `https://docs.google.com/gview?url=${encodeURIComponent(
                                attachment.cloudinaryUrl || attachment.url
                              )}&embedded=true`
                            : attachment.cloudinaryUrl || attachment.url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => onFileDelete(attachment._id)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <Box sx={{ display: "flex", alignItems: "center", width: '100%' }}>
                    {getFileIcon(attachment.mimetype, attachment)}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 'medium',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {attachment.originalName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Chip 
                          label={attachment.mimetype.split('/')[1].toUpperCase()}
                          size="small"
                          sx={{ 
                            height: 20, 
                            fontSize: '0.7rem',
                            bgcolor: attachment.mimetype === "application/pdf" 
                              ? 'rgba(229, 57, 53, 0.1)' 
                              : 'rgba(66, 165, 245, 0.1)',
                            color: attachment.mimetype === "application/pdf" 
                              ? 'rgb(229, 57, 53)' 
                              : 'rgb(66, 165, 245)',
                            mr: 1
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {attachment.size && formatFileSize(attachment.size)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ) : null}
    </Box>
  );
};

export default FileUpload;
