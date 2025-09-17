package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"mime/multipart"
	"net/http"
	"time"

	"github.com/sirupsen/logrus"
)

type CaptchaSolver interface {
	SolveCaptcha(imageData []byte, captchaType string) (string, error)
	GetBalance() (float64, error)
}

// TwoCaptchaSolver implements 2captcha.com API
type TwoCaptchaSolver struct {
	apiKey string
	client *http.Client
	logger *logrus.Logger
}

func NewTwoCaptchaSolver(apiKey string) *TwoCaptchaSolver {
	return &TwoCaptchaSolver{
		apiKey: apiKey,
		client: &http.Client{Timeout: 30 * time.Second},
		logger: logrus.New(),
	}
}

func (s *TwoCaptchaSolver) SolveCaptcha(imageData []byte, captchaType string) (string, error) {
	s.logger.Info("Starting CAPTCHA solving with 2captcha")
	
	// Upload captcha image
	uploadResp, err := s.uploadCaptcha(imageData)
	if err != nil {
		return "", fmt.Errorf("failed to upload CAPTCHA: %w", err)
	}

	s.logger.WithField("captcha_id", uploadResp.CaptchaID).Info("CAPTCHA uploaded, waiting for solution")

	// Poll for solution
	solution, err := s.pollForSolution(uploadResp.CaptchaID)
	if err != nil {
		return "", fmt.Errorf("failed to get CAPTCHA solution: %w", err)
	}

	s.logger.Info("CAPTCHA solved successfully")
	return solution, nil
}

type UploadResponse struct {
	Status    int    `json:"status"`
	Request   string `json:"request"`
	CaptchaID string `json:"request"`
}

func (s *TwoCaptchaSolver) uploadCaptcha(imageData []byte) (*UploadResponse, error) {
	url := "http://2captcha.com/in.php"
	
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	
	// Add API key
	writer.WriteField("key", s.apiKey)
	writer.WriteField("method", "base64")
	
	// Add image data
	part, err := writer.CreateFormField("body")
	if err != nil {
		return nil, err
	}
	part.Write(imageData)
	
	writer.Close()
	
	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	var uploadResp UploadResponse
	if err := json.NewDecoder(resp.Body).Decode(&uploadResp); err != nil {
		return nil, err
	}
	
	if uploadResp.Status != 1 {
		return nil, fmt.Errorf("upload failed: %s", uploadResp.Request)
	}
	
	return &uploadResp, nil
}

func (s *TwoCaptchaSolver) pollForSolution(captchaID string) (string, error) {
	url := fmt.Sprintf("http://2captcha.com/res.php?key=%s&action=get&id=%s", s.apiKey, captchaID)
	
	for i := 0; i < 30; i++ { // Max 5 minutes
		time.Sleep(10 * time.Second)
		
		resp, err := s.client.Get(url)
		if err != nil {
			continue
		}
		defer resp.Body.Close()
		
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			continue
		}
		
		if string(body) == "CAPCHA_NOT_READY" {
			continue
		}
		
		if len(string(body)) > 3 && string(body)[:3] == "OK|" {
			return string(body)[3:], nil
		}
		
		return "", fmt.Errorf("captcha solving failed: %s", string(body))
	}
	
	return "", fmt.Errorf("captcha solving timeout")
}

func (s *TwoCaptchaSolver) GetBalance() (float64, error) {
	url := fmt.Sprintf("http://2captcha.com/res.php?key=%s&action=getbalance", s.apiKey)
	
	resp, err := s.client.Get(url)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, err
	}
	
	var balance float64
	if _, err := fmt.Sscanf(string(body), "%f", &balance); err != nil {
		return 0, err
	}
	
	return balance, nil
}

// AntiCaptchaSolver implements anticaptcha.com API
type AntiCaptchaSolver struct {
	apiKey string
	client *http.Client
	logger *logrus.Logger
}

func NewAntiCaptchaSolver(apiKey string) *AntiCaptchaSolver {
	return &AntiCaptchaSolver{
		apiKey: apiKey,
		client: &http.Client{Timeout: 30 * time.Second},
		logger: logrus.New(),
	}
}

func (s *AntiCaptchaSolver) SolveCaptcha(imageData []byte, captchaType string) (string, error) {
	s.logger.Info("Starting CAPTCHA solving with AntiCaptcha")
	
	// Create task
	taskID, err := s.createTask(imageData)
	if err != nil {
		return "", fmt.Errorf("failed to create task: %w", err)
	}

	s.logger.WithField("task_id", taskID).Info("Task created, waiting for solution")

	// Poll for solution
	solution, err := s.pollForSolution(taskID)
	if err != nil {
		return "", fmt.Errorf("failed to get solution: %w", err)
	}

	s.logger.Info("CAPTCHA solved successfully")
	return solution, nil
}

type AntiCaptchaTask struct {
	ClientKey string `json:"clientKey"`
	Task      struct {
		Type      string `json:"type"`
		Body      string `json:"body"`
	} `json:"task"`
}

type AntiCaptchaResponse struct {
	ErrorID          int    `json:"errorId"`
	ErrorCode        string `json:"errorCode"`
	ErrorDescription string `json:"errorDescription"`
	TaskID           int    `json:"taskId"`
}

type AntiCaptchaResult struct {
	ErrorID          int    `json:"errorId"`
	ErrorCode        string `json:"errorCode"`
	ErrorDescription string `json:"errorDescription"`
	Status           string `json:"status"`
	Solution         struct {
		Text string `json:"text"`
	} `json:"solution"`
}

func (s *AntiCaptchaSolver) createTask(imageData []byte) (int, error) {
	url := "https://api.anti-captcha.com/createTask"
	
	task := AntiCaptchaTask{
		ClientKey: s.apiKey,
	}
	task.Task.Type = "ImageToTextTask"
	task.Task.Body = string(imageData)
	
	jsonData, err := json.Marshal(task)
	if err != nil {
		return 0, err
	}
	
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := s.client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	
	var response AntiCaptchaResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return 0, err
	}
	
	if response.ErrorID != 0 {
		return 0, fmt.Errorf("create task failed: %s", response.ErrorDescription)
	}
	
	return response.TaskID, nil
}

func (s *AntiCaptchaSolver) pollForSolution(taskID int) (string, error) {
	url := "https://api.anti-captcha.com/getTaskResult"
	
	requestData := map[string]interface{}{
		"clientKey": s.apiKey,
		"taskId":    taskID,
	}
	
	for i := 0; i < 30; i++ { // Max 5 minutes
		time.Sleep(10 * time.Second)
		
		jsonData, err := json.Marshal(requestData)
		if err != nil {
			continue
		}
		
		req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
		if err != nil {
			continue
		}
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := s.client.Do(req)
		if err != nil {
			continue
		}
		defer resp.Body.Close()
		
		var result AntiCaptchaResult
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			continue
		}
		
		if result.ErrorID != 0 {
			return "", fmt.Errorf("get result failed: %s", result.ErrorDescription)
		}
		
		if result.Status == "ready" {
			return result.Solution.Text, nil
		}
	}
	
	return "", fmt.Errorf("captcha solving timeout")
}

func (s *AntiCaptchaSolver) GetBalance() (float64, error) {
	url := "https://api.anti-captcha.com/getBalance"
	
	requestData := map[string]string{
		"clientKey": s.apiKey,
	}
	
	jsonData, err := json.Marshal(requestData)
	if err != nil {
		return 0, err
	}
	
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := s.client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	
	var result struct {
		ErrorID          int     `json:"errorId"`
		ErrorCode        string  `json:"errorCode"`
		ErrorDescription string  `json:"errorDescription"`
		Balance          float64 `json:"balance"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, err
	}
	
	if result.ErrorID != 0 {
		return 0, fmt.Errorf("get balance failed: %s", result.ErrorDescription)
	}
	
	return result.Balance, nil
}

// ManualCaptchaSolver implements manual CAPTCHA solving (for development/testing)
type ManualCaptchaSolver struct {
	logger *logrus.Logger
}

func NewManualCaptchaSolver() *ManualCaptchaSolver {
	return &ManualCaptchaSolver{
		logger: logrus.New(),
	}
}

func (s *ManualCaptchaSolver) SolveCaptcha(imageData []byte, captchaType string) (string, error) {
	s.logger.Info("Manual CAPTCHA solver - this is for development/testing only")
	s.logger.Info("In production, use 2captcha or anticaptcha services")
	
	// For testing purposes, return a random string
	// In real implementation, this would prompt the user or save the image for manual solving
	rand.Seed(time.Now().UnixNano())
	testSolutions := []string{"test123", "captcha", "solve", "manual"}
	return testSolutions[rand.Intn(len(testSolutions))], nil
}

func (s *ManualCaptchaSolver) GetBalance() (float64, error) {
	return 0.0, nil
}
