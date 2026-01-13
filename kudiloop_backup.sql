--
-- PostgreSQL database dump
--

\restrict 213XZSXgnQC9iqAcVAqxktsoejdCwAyu8GarU9R2RXY0bqIawqwRg0xZaudM1Se

-- Dumped from database version 16.11 (74c6bb6)
-- Dumped by pg_dump version 16.11 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: audit_action; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.audit_action AS ENUM (
    'user_created',
    'user_updated',
    'user_deleted',
    'user_banned',
    'user_unbanned',
    'user_restricted',
    'profile_edited',
    'status_changed',
    'sql_query_executed',
    'group_deleted',
    'create_partner',
    'update_partner',
    'delete_partner',
    'upload_partner_logo'
);


ALTER TYPE public.audit_action OWNER TO neondb_owner;

--
-- Name: currency; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.currency AS ENUM (
    'NGN',
    'GBP',
    'EUR',
    'USD',
    'CAD'
);


ALTER TYPE public.currency OWNER TO neondb_owner;

--
-- Name: device_platform; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.device_platform AS ENUM (
    'ios',
    'android',
    'web'
);


ALTER TYPE public.device_platform OWNER TO neondb_owner;

--
-- Name: export_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.export_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


ALTER TYPE public.export_status OWNER TO neondb_owner;

--
-- Name: export_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.export_type AS ENUM (
    'contributions',
    'groups',
    'all'
);


ALTER TYPE public.export_type OWNER TO neondb_owner;

--
-- Name: gender; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.gender AS ENUM (
    'male',
    'female',
    'prefer_not_to_say'
);


ALTER TYPE public.gender OWNER TO neondb_owner;

--
-- Name: group_frequency; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.group_frequency AS ENUM (
    'weekly',
    'monthly'
);


ALTER TYPE public.group_frequency OWNER TO neondb_owner;

--
-- Name: group_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.group_status AS ENUM (
    'pending',
    'active',
    'completed'
);


ALTER TYPE public.group_status OWNER TO neondb_owner;

--
-- Name: group_visibility; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.group_visibility AS ENUM (
    'open',
    'closed'
);


ALTER TYPE public.group_visibility OWNER TO neondb_owner;

--
-- Name: join_request_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.join_request_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.join_request_status OWNER TO neondb_owner;

--
-- Name: member_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.member_role AS ENUM (
    'creator',
    'participant'
);


ALTER TYPE public.member_role OWNER TO neondb_owner;

--
-- Name: member_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.member_status AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE public.member_status OWNER TO neondb_owner;

--
-- Name: message_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.message_type AS ENUM (
    'direct',
    'group',
    'inbox'
);


ALTER TYPE public.message_type OWNER TO neondb_owner;

--
-- Name: notification_channel; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.notification_channel AS ENUM (
    'push',
    'email',
    'in_app'
);


ALTER TYPE public.notification_channel OWNER TO neondb_owner;

--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.notification_type AS ENUM (
    'contribution_reminder',
    'contribution_received',
    'payout_upcoming',
    'payout_received',
    'group_invitation',
    'group_joined',
    'cycle_advanced',
    'message_received',
    'system_announcement'
);


ALTER TYPE public.notification_type OWNER TO neondb_owner;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.payment_status AS ENUM (
    'paid',
    'pending',
    'overdue'
);


ALTER TYPE public.payment_status OWNER TO neondb_owner;

--
-- Name: payout_medium; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.payout_medium AS ENUM (
    'admin',
    'cycle_receiver'
);


ALTER TYPE public.payout_medium OWNER TO neondb_owner;

--
-- Name: pot_transaction_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.pot_transaction_type AS ENUM (
    'deposit',
    'withdrawal'
);


ALTER TYPE public.pot_transaction_type OWNER TO neondb_owner;

--
-- Name: user_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'restricted',
    'banned',
    'deleted'
);


ALTER TYPE public.user_status OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.audit_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    actor_id character varying NOT NULL,
    target_user_id character varying,
    action public.audit_action NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_events OWNER TO neondb_owner;

--
-- Name: contributions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contributions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    group_id character varying NOT NULL,
    member_id character varying NOT NULL,
    cycle integer NOT NULL,
    amount integer NOT NULL,
    status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    date_paid text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    receipt_url text
);


ALTER TABLE public.contributions OWNER TO neondb_owner;

--
-- Name: data_exports; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.data_exports (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    export_type public.export_type NOT NULL,
    status public.export_status DEFAULT 'pending'::public.export_status NOT NULL,
    file_url text,
    file_name character varying(255),
    file_size integer,
    expires_at timestamp without time zone,
    error_message text,
    requested_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone
);


ALTER TABLE public.data_exports OWNER TO neondb_owner;

--
-- Name: device_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.device_tokens (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    token text NOT NULL,
    platform public.device_platform NOT NULL,
    device_name character varying(200),
    is_active integer DEFAULT 1 NOT NULL,
    last_used timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.device_tokens OWNER TO neondb_owner;

--
-- Name: groups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.groups (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    contribution_amount integer NOT NULL,
    frequency public.group_frequency NOT NULL,
    status public.group_status DEFAULT 'pending'::public.group_status NOT NULL,
    current_cycle integer DEFAULT 1 NOT NULL,
    total_cycles integer NOT NULL,
    next_collection_date text NOT NULL,
    start_date text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    currency public.currency DEFAULT 'NGN'::public.currency NOT NULL,
    user_id character varying NOT NULL,
    visibility public.group_visibility DEFAULT 'closed'::public.group_visibility NOT NULL,
    max_members integer,
    go_live_date timestamp without time zone NOT NULL,
    is_live integer DEFAULT 0 NOT NULL,
    completed_at timestamp without time zone,
    adjusted_go_live_date timestamp without time zone,
    payout_medium public.payout_medium DEFAULT 'cycle_receiver'::public.payout_medium NOT NULL,
    schedule_visibility integer DEFAULT 1 NOT NULL,
    recipient_visibility integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.groups OWNER TO neondb_owner;

--
-- Name: invite_links; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invite_links (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    group_id character varying NOT NULL,
    token character varying NOT NULL,
    created_by character varying NOT NULL,
    expires_at timestamp without time zone,
    max_uses integer,
    used_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.invite_links OWNER TO neondb_owner;

--
-- Name: join_requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.join_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    group_id character varying NOT NULL,
    user_id character varying NOT NULL,
    status public.join_request_status DEFAULT 'pending'::public.join_request_status NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.join_requests OWNER TO neondb_owner;

--
-- Name: members; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.members (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    group_id character varying NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    avatar text,
    join_date text NOT NULL,
    status public.member_status DEFAULT 'active'::public.member_status NOT NULL,
    rotation_order integer NOT NULL,
    user_id character varying,
    role public.member_role DEFAULT 'participant'::public.member_role NOT NULL,
    can_post_in_group integer DEFAULT 1 NOT NULL,
    is_admin integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.members OWNER TO neondb_owner;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    group_id character varying,
    sender_id character varying NOT NULL,
    recipient_id character varying,
    type public.message_type NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.messages OWNER TO neondb_owner;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    type public.notification_type NOT NULL,
    channel public.notification_channel NOT NULL,
    title character varying(255) NOT NULL,
    body text NOT NULL,
    metadata jsonb,
    is_read integer DEFAULT 0 NOT NULL,
    sent_at timestamp without time zone DEFAULT now() NOT NULL,
    read_at timestamp without time zone
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: partner_clicks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.partner_clicks (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    partner_id character varying NOT NULL,
    user_id character varying,
    clicked_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.partner_clicks OWNER TO neondb_owner;

--
-- Name: partners; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.partners (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    description text NOT NULL,
    category character varying(100) NOT NULL,
    affiliate_link text NOT NULL,
    commission_rate character varying(100),
    logo_url text,
    color character varying(50) DEFAULT 'from-blue-500 to-cyan-500'::character varying NOT NULL,
    is_active integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.partners OWNER TO neondb_owner;

--
-- Name: payment_receipts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payment_receipts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    group_id character varying NOT NULL,
    member_id character varying NOT NULL,
    uploaded_by character varying NOT NULL,
    cycle_number integer NOT NULL,
    receipt_url text NOT NULL,
    file_size integer NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payment_receipts OWNER TO neondb_owner;

--
-- Name: pot_transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pot_transactions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    pot_id character varying NOT NULL,
    user_id character varying NOT NULL,
    amount numeric(15,2) NOT NULL,
    currency public.currency NOT NULL,
    type public.pot_transaction_type NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pot_transactions OWNER TO neondb_owner;

--
-- Name: savings_pots; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.savings_pots (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    name character varying(100) NOT NULL,
    balance_ngn numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    balance_gbp numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    balance_usd numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    balance_eur numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.savings_pots OWNER TO neondb_owner;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    theme character varying(20) DEFAULT 'light'::character varying NOT NULL,
    inactivity_timeout_enabled integer DEFAULT 1 NOT NULL,
    inactivity_timeout_minutes integer DEFAULT 3 NOT NULL,
    biometric_enabled integer DEFAULT 0 NOT NULL,
    push_notifications_enabled integer DEFAULT 1 NOT NULL,
    email_notifications_enabled integer DEFAULT 1 NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_settings OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    phone character varying,
    about_me text,
    local_bank_account_name character varying,
    local_bank_account_number character varying,
    local_bank_name character varying,
    international_bank_account_name character varying,
    international_bank_account_number character varying,
    international_bank_swift_code character varying,
    international_bank_iban character varying,
    preferred_name character varying,
    local_bank_sort_code character varying,
    is_admin integer DEFAULT 0 NOT NULL,
    status public.user_status DEFAULT 'active'::public.user_status NOT NULL,
    deleted_at timestamp without time zone,
    restricted_until timestamp without time zone,
    avatar_choice character varying,
    gender public.gender,
    deletion_count integer DEFAULT 0 NOT NULL,
    password_hash character varying,
    auth_provider character varying,
    auth_provider_id character varying,
    password_reset_token character varying,
    password_reset_expires timestamp without time zone,
    total_funds_ngn numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    total_funds_gbp numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    total_funds_usd numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    total_funds_eur numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    clerk_user_id character varying
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Data for Name: audit_events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.audit_events (id, actor_id, target_user_id, action, metadata, created_at) FROM stdin;
45842268-a671-4861-a5fa-66cb82659f61	49819811	\N	sql_query_executed	{"sqlQuery": "SELECT * FROM users LIMIT 5", "resultCount": 5}	2025-11-19 18:32:00.076649
dae0ea1f-4c60-4def-8ab4-f28e667a316f	49819811	49819811	group_deleted	{"groupId": "8392b743-f338-434d-b5db-dcc590d3943e", "deletedBy": "admin", "groupName": "Completed Test Group 5iQVB5"}	2025-11-19 21:09:32.646518
71320fac-8427-4fd2-a9f1-32c7f15b0931	49819811	49819811	group_deleted	{"groupId": "1e5d2ca4-d562-4ba5-88c5-c4b175210fdd", "deletedBy": "admin", "groupName": "Test 2"}	2025-11-21 13:31:52.138841
\.


--
-- Data for Name: contributions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contributions (id, group_id, member_id, cycle, amount, status, date_paid, created_at, receipt_url) FROM stdin;
a6ff0199-b38b-4321-825c-2e36ea9cb3ea	0b32fd7f-1b17-458f-8a9c-ad592c8b036e	07d0f3ae-0755-47ae-a0e4-d611e8dc39fc	1	500	paid	2025-11-21	2025-11-21 11:08:34.721367	\N
9751f618-6e09-4a65-bf75-2f1571f513fb	0b32fd7f-1b17-458f-8a9c-ad592c8b036e	52bf6836-4770-4fbd-8c84-f71efd2b05a2	1	500	paid	2025-11-21	2025-11-21 11:15:04.915967	\N
5cbebe8f-fe29-4249-86de-488795678224	0b32fd7f-1b17-458f-8a9c-ad592c8b036e	b10427b9-9cec-4dac-8a14-99975caece93	1	500	paid	2025-11-21	2025-11-21 11:15:14.219656	\N
75514ced-ff4a-439f-ac52-35e91be47a3e	9fde8e31-4ddf-43b8-80b6-acffc5259d27	539ae7ce-e583-47c6-8eaa-2b731c142b38	2	475575	pending	\N	2025-11-23 12:20:35.914787	\N
ecd2fb6e-89c3-48c1-880f-ba0a026513fd	0b32fd7f-1b17-458f-8a9c-ad592c8b036e	07d0f3ae-0755-47ae-a0e4-d611e8dc39fc	2	500	paid	2025-11-21	2025-11-21 11:08:34.836718	\N
75b9ef7e-1638-4770-9482-a7223b6da8ac	9fde8e31-4ddf-43b8-80b6-acffc5259d27	539ae7ce-e583-47c6-8eaa-2b731c142b38	3	475575	pending	\N	2025-11-23 12:20:36.029263	\N
922a9cf7-ac2e-4e94-98d1-54208401b018	0b32fd7f-1b17-458f-8a9c-ad592c8b036e	52bf6836-4770-4fbd-8c84-f71efd2b05a2	2	500	paid	2025-11-21	2025-11-21 11:15:05.032271	\N
86947dae-c54b-4902-8219-8940f4bc5d76	9fde8e31-4ddf-43b8-80b6-acffc5259d27	539ae7ce-e583-47c6-8eaa-2b731c142b38	4	475575	pending	\N	2025-11-23 12:20:36.142333	\N
0b16de46-df32-4e0f-b554-d6abbf59d1ef	0b32fd7f-1b17-458f-8a9c-ad592c8b036e	b10427b9-9cec-4dac-8a14-99975caece93	2	500	paid	2025-11-21	2025-11-21 11:15:14.330669	\N
b673c8fc-27d5-4243-a888-774283183ea6	0b32fd7f-1b17-458f-8a9c-ad592c8b036e	07d0f3ae-0755-47ae-a0e4-d611e8dc39fc	3	500	paid	2025-11-21	2025-11-21 11:08:34.948918	\N
c140dd15-e7cc-4b31-b901-bb03c363c584	0b32fd7f-1b17-458f-8a9c-ad592c8b036e	52bf6836-4770-4fbd-8c84-f71efd2b05a2	3	500	paid	2025-11-21	2025-11-21 11:15:05.145447	\N
739da0e8-fe6c-4917-910c-1f025489594b	0b32fd7f-1b17-458f-8a9c-ad592c8b036e	b10427b9-9cec-4dac-8a14-99975caece93	3	500	paid	2025-11-21	2025-11-21 11:15:14.442008	\N
7f40bf50-59df-4da8-922b-f5d0af8ed2e6	9fde8e31-4ddf-43b8-80b6-acffc5259d27	539ae7ce-e583-47c6-8eaa-2b731c142b38	5	475575	pending	\N	2025-11-23 12:20:36.255516	\N
42684d26-33e1-4ba1-9234-855b74b93976	9fde8e31-4ddf-43b8-80b6-acffc5259d27	ab2f9cda-a1be-4d73-8e5f-690a75add5e1	2	475575	pending	\N	2025-11-23 12:48:55.575228	\N
2c19f8b6-790a-4598-b628-b6406f4bf9cc	9fde8e31-4ddf-43b8-80b6-acffc5259d27	ab2f9cda-a1be-4d73-8e5f-690a75add5e1	3	475575	pending	\N	2025-11-23 12:48:55.688056	\N
2674f02a-8ca7-430e-b896-0d3532b051e6	9fde8e31-4ddf-43b8-80b6-acffc5259d27	ab2f9cda-a1be-4d73-8e5f-690a75add5e1	4	475575	pending	\N	2025-11-23 12:48:55.800642	\N
f2978e65-6744-4009-a57b-977f22af732f	9fde8e31-4ddf-43b8-80b6-acffc5259d27	ab2f9cda-a1be-4d73-8e5f-690a75add5e1	5	475575	pending	\N	2025-11-23 12:48:55.913535	\N
c1706062-e8c5-4f99-b856-b4faef0314f8	9fde8e31-4ddf-43b8-80b6-acffc5259d27	b2d63668-905b-47b7-b277-19b8198244bf	2	475575	pending	\N	2025-11-23 12:57:47.740901	\N
458e6cf4-66f3-4491-88a9-a4e3f11f9df8	9fde8e31-4ddf-43b8-80b6-acffc5259d27	b2d63668-905b-47b7-b277-19b8198244bf	3	475575	pending	\N	2025-11-23 12:57:47.853671	\N
21ca0f2d-370b-43b5-8c39-7d90c767be23	9fde8e31-4ddf-43b8-80b6-acffc5259d27	b2d63668-905b-47b7-b277-19b8198244bf	4	475575	pending	\N	2025-11-23 12:57:47.966142	\N
a530233a-6b7a-41b8-b587-b34deea62ff5	9fde8e31-4ddf-43b8-80b6-acffc5259d27	b2d63668-905b-47b7-b277-19b8198244bf	5	475575	pending	\N	2025-11-23 12:57:48.078662	\N
d6d0eb98-bcba-46dc-b662-dbd74b009555	9fde8e31-4ddf-43b8-80b6-acffc5259d27	539ae7ce-e583-47c6-8eaa-2b731c142b38	1	475575	paid	2025-11-23	2025-11-23 12:20:35.789529	\N
8a2221e8-071a-4266-a22e-873039b3524b	9fde8e31-4ddf-43b8-80b6-acffc5259d27	ab2f9cda-a1be-4d73-8e5f-690a75add5e1	1	475575	paid	2025-11-23	2025-11-23 12:48:55.457957	\N
e7a42e07-0479-436c-bb8c-f13e21d4a1f3	ace139f5-df59-48a0-ac68-fa5908e91be8	5c0053bb-d1d8-4d1d-a72e-7afd0a69834c	2	7257676	paid	2026-01-02	2025-11-23 13:10:19.984585	\N
6ab2ee09-7376-45ff-8e63-77d47d428b7c	ace139f5-df59-48a0-ac68-fa5908e91be8	5c0053bb-d1d8-4d1d-a72e-7afd0a69834c	1	7257676	paid	2025-11-23	2025-11-23 13:10:19.869183	\N
43b792e7-bf32-4a59-9eb4-7e32033b8a53	9fde8e31-4ddf-43b8-80b6-acffc5259d27	b2d63668-905b-47b7-b277-19b8198244bf	1	475575	paid	2025-11-23	2025-11-23 12:57:47.622843	\N
54d0f99f-126f-409d-8485-3773fe838cf9	ace139f5-df59-48a0-ac68-fa5908e91be8	5c0053bb-d1d8-4d1d-a72e-7afd0a69834c	3	7257676	pending	\N	2025-11-23 13:10:20.098967	\N
a9ac256b-8046-40bd-9a99-3de046e39067	ace139f5-df59-48a0-ac68-fa5908e91be8	5c0053bb-d1d8-4d1d-a72e-7afd0a69834c	4	7257676	pending	\N	2025-11-23 13:10:20.212017	\N
ba3cbc36-e02d-4b80-b303-d21b93326d77	ace139f5-df59-48a0-ac68-fa5908e91be8	5c0053bb-d1d8-4d1d-a72e-7afd0a69834c	5	7257676	pending	\N	2025-11-23 13:10:20.325065	\N
3e2d1e64-ee39-4351-a15d-68c159a3bff6	ace139f5-df59-48a0-ac68-fa5908e91be8	5c0053bb-d1d8-4d1d-a72e-7afd0a69834c	6	7257676	pending	\N	2025-11-23 13:10:20.438148	\N
dc418190-76e9-44c8-9060-3069e4d2948c	ace139f5-df59-48a0-ac68-fa5908e91be8	5c0053bb-d1d8-4d1d-a72e-7afd0a69834c	7	7257676	pending	\N	2025-11-23 13:10:20.551503	\N
9c1dc450-17c1-44ac-9492-ab0e745224d0	ace139f5-df59-48a0-ac68-fa5908e91be8	5c0053bb-d1d8-4d1d-a72e-7afd0a69834c	8	7257676	pending	\N	2025-11-23 13:10:20.665069	\N
15bb37bd-bcc0-4d6b-a39c-6c8055173efe	ace139f5-df59-48a0-ac68-fa5908e91be8	5c0053bb-d1d8-4d1d-a72e-7afd0a69834c	9	7257676	pending	\N	2025-11-23 13:10:20.779478	\N
7b163d55-4e16-4b0b-9492-36f01a9bbba4	ace139f5-df59-48a0-ac68-fa5908e91be8	5c0053bb-d1d8-4d1d-a72e-7afd0a69834c	10	7257676	pending	\N	2025-11-23 13:10:20.893674	\N
d402bcc8-b8c7-4fd5-a156-e32793eb5a20	ace139f5-df59-48a0-ac68-fa5908e91be8	4fcf8430-5bec-433a-a48f-0b05a9ca98c7	3	7257676	pending	\N	2025-11-23 13:10:39.054668	\N
4945287d-39ee-4460-8c34-8a89b0a0e420	ace139f5-df59-48a0-ac68-fa5908e91be8	4fcf8430-5bec-433a-a48f-0b05a9ca98c7	4	7257676	pending	\N	2025-11-23 13:10:39.166825	\N
1b1f0322-a1ad-4136-b5c4-b1a0c2d78195	ace139f5-df59-48a0-ac68-fa5908e91be8	4fcf8430-5bec-433a-a48f-0b05a9ca98c7	5	7257676	pending	\N	2025-11-23 13:10:39.279398	\N
b0e94ccc-0c84-42ee-a4fd-4176ad49900b	ace139f5-df59-48a0-ac68-fa5908e91be8	4fcf8430-5bec-433a-a48f-0b05a9ca98c7	6	7257676	pending	\N	2025-11-23 13:10:39.391755	\N
d15d8c9a-17cd-4738-9e4d-08f715a8541b	ace139f5-df59-48a0-ac68-fa5908e91be8	4fcf8430-5bec-433a-a48f-0b05a9ca98c7	7	7257676	pending	\N	2025-11-23 13:10:39.505432	\N
7ea32f33-7676-41ca-8010-2f951d12d99b	ace139f5-df59-48a0-ac68-fa5908e91be8	4fcf8430-5bec-433a-a48f-0b05a9ca98c7	8	7257676	pending	\N	2025-11-23 13:10:39.61792	\N
5adda069-2563-46af-b870-eeb2036e9091	ace139f5-df59-48a0-ac68-fa5908e91be8	4fcf8430-5bec-433a-a48f-0b05a9ca98c7	9	7257676	pending	\N	2025-11-23 13:10:39.730475	\N
f03b4a2c-5243-40ce-ac3a-6222dd5a67c1	ace139f5-df59-48a0-ac68-fa5908e91be8	4fcf8430-5bec-433a-a48f-0b05a9ca98c7	10	7257676	pending	\N	2025-11-23 13:10:39.843604	\N
eddc9bf5-6eb5-4130-9f52-9653f8d8b0ad	ace139f5-df59-48a0-ac68-fa5908e91be8	4109bc28-7127-40ea-9ec6-346aabb4a9ab	3	7257676	pending	\N	2025-11-23 13:10:49.528406	\N
adec138f-1d2b-40ba-add9-95d88c84835e	ace139f5-df59-48a0-ac68-fa5908e91be8	4109bc28-7127-40ea-9ec6-346aabb4a9ab	4	7257676	pending	\N	2025-11-23 13:10:49.641074	\N
d02aa3f3-18f8-4fe0-b043-9fbbf561c573	ace139f5-df59-48a0-ac68-fa5908e91be8	4109bc28-7127-40ea-9ec6-346aabb4a9ab	5	7257676	pending	\N	2025-11-23 13:10:49.753534	\N
bd1d514f-ffd3-4e13-ae4c-2083038786a5	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	2aaa9fc8-8fe9-4df9-848f-3305ff6a895f	4	500	pending	\N	2025-11-21 14:03:49.743267	\N
23df6fde-db71-4af9-89f1-a03515f096dd	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	2aaa9fc8-8fe9-4df9-848f-3305ff6a895f	5	500	pending	\N	2025-11-21 14:03:49.857125	\N
efca1b45-256a-4beb-b067-06f906265ec3	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	2aaa9fc8-8fe9-4df9-848f-3305ff6a895f	6	500	pending	\N	2025-11-21 14:03:49.971515	\N
4d7cc8e7-0d28-444b-a527-6d46daf6bf52	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	2aaa9fc8-8fe9-4df9-848f-3305ff6a895f	7	500	pending	\N	2025-11-21 14:03:50.083993	\N
03e4c24c-e3c1-4328-8256-e114e70032e9	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	2aaa9fc8-8fe9-4df9-848f-3305ff6a895f	8	500	pending	\N	2025-11-21 14:03:50.19692	\N
1ecf410d-2901-4208-9101-781044f1bd6b	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	2aaa9fc8-8fe9-4df9-848f-3305ff6a895f	9	500	pending	\N	2025-11-21 14:03:50.309609	\N
dacd2ca4-7b90-440c-afba-baae19c99441	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	2aaa9fc8-8fe9-4df9-848f-3305ff6a895f	10	500	pending	\N	2025-11-21 14:03:50.422325	\N
25709904-9b21-40c9-9a94-5379744cd596	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	c61ead8b-021b-4e47-81d3-576a94b3b8f0	4	500	pending	\N	2025-11-21 14:04:52.769994	\N
a97fa5ba-9825-4f61-be0a-6b99271859bf	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	c61ead8b-021b-4e47-81d3-576a94b3b8f0	5	500	pending	\N	2025-11-21 14:04:52.882654	\N
0de8f315-2474-449d-9727-a6db1427f46d	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	c61ead8b-021b-4e47-81d3-576a94b3b8f0	6	500	pending	\N	2025-11-21 14:04:52.994159	\N
13f73e2d-27fe-4707-84c1-27bbd38c99bb	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	c61ead8b-021b-4e47-81d3-576a94b3b8f0	7	500	pending	\N	2025-11-21 14:04:53.108112	\N
bc9db80d-cc48-4074-a63a-0c88bf9265b2	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	c61ead8b-021b-4e47-81d3-576a94b3b8f0	8	500	pending	\N	2025-11-21 14:04:53.219729	\N
a6bf50aa-7074-496e-9171-496b029c6330	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	c61ead8b-021b-4e47-81d3-576a94b3b8f0	9	500	pending	\N	2025-11-21 14:04:53.331291	\N
a63fff4c-9272-4a2f-a844-bfbd6db680a8	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	c61ead8b-021b-4e47-81d3-576a94b3b8f0	10	500	pending	\N	2025-11-21 14:04:53.443379	\N
33f18b50-4e25-444c-bb26-c883546cbf73	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	d076abf5-c0fd-45bf-981b-2a2e94a89d09	4	500	pending	\N	2025-11-21 14:05:07.598172	\N
7664560a-cdf5-4714-8f3d-920c8617562b	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	d076abf5-c0fd-45bf-981b-2a2e94a89d09	5	500	pending	\N	2025-11-21 14:05:07.715592	\N
f654f992-bcbc-4787-8ddf-8b880622c33f	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	d076abf5-c0fd-45bf-981b-2a2e94a89d09	6	500	pending	\N	2025-11-21 14:05:07.82974	\N
75391a7d-65b4-43bf-bf7a-eedc67cbb6f6	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	d076abf5-c0fd-45bf-981b-2a2e94a89d09	7	500	pending	\N	2025-11-21 14:05:07.9431	\N
23e716a2-578e-43bd-a258-8b2c42255ee0	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	d076abf5-c0fd-45bf-981b-2a2e94a89d09	8	500	pending	\N	2025-11-21 14:05:08.056616	\N
50ce3840-93ed-4564-af68-be9fc7dcc6f7	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	d076abf5-c0fd-45bf-981b-2a2e94a89d09	9	500	pending	\N	2025-11-21 14:05:08.171362	\N
a3b6d6d0-6dcf-4402-89f4-2e1decbc2450	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	d076abf5-c0fd-45bf-981b-2a2e94a89d09	10	500	pending	\N	2025-11-21 14:05:08.284752	\N
3482e7d9-558b-4784-a237-4143a10a80b6	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	c61ead8b-021b-4e47-81d3-576a94b3b8f0	3	500	paid	2025-11-28	2025-11-21 14:04:52.658425	\N
8bd0df91-25bb-415c-a72e-7d6f5aca26ac	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	d076abf5-c0fd-45bf-981b-2a2e94a89d09	3	500	paid	2025-11-28	2025-11-21 14:05:07.479751	\N
f3eae2f7-454b-459e-aec7-a454d93171e3	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	2aaa9fc8-8fe9-4df9-848f-3305ff6a895f	3	500	paid	2025-11-28	2025-11-21 14:03:49.630718	uploads/receipts/receipt-1764353021464-135389981.jpg
e4360419-3c27-41ad-85df-ec19002bcba6	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	c61ead8b-021b-4e47-81d3-576a94b3b8f0	1	500	paid	2025-11-24	2025-11-21 14:04:52.434244	\N
6f302543-a947-44c0-b84e-6b8b36f346d0	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	2aaa9fc8-8fe9-4df9-848f-3305ff6a895f	2	500	paid	2025-11-24	2025-11-21 14:03:49.516386	\N
f0f13bb9-8470-467c-845b-b36fa532cb34	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	c61ead8b-021b-4e47-81d3-576a94b3b8f0	2	500	paid	2025-11-24	2025-11-21 14:04:52.546447	\N
b625eecd-43a1-4ff4-9400-4021555ebef8	ace139f5-df59-48a0-ac68-fa5908e91be8	4109bc28-7127-40ea-9ec6-346aabb4a9ab	1	7257676	paid	2025-11-23	2025-11-23 13:10:49.303547	\N
581f2a89-944f-457a-aef5-19c1c06752b7	ace139f5-df59-48a0-ac68-fa5908e91be8	4fcf8430-5bec-433a-a48f-0b05a9ca98c7	2	7257676	paid	2026-01-02	2025-11-23 13:10:38.942235	\N
792d577e-1327-44d8-98c8-0c027e655407	ace139f5-df59-48a0-ac68-fa5908e91be8	4109bc28-7127-40ea-9ec6-346aabb4a9ab	2	7257676	paid	2026-01-02	2025-11-23 13:10:49.416512	\N
795a108b-44bf-437a-802a-abeb0cfe148e	ace139f5-df59-48a0-ac68-fa5908e91be8	4109bc28-7127-40ea-9ec6-346aabb4a9ab	6	7257676	pending	\N	2025-11-23 13:10:49.865534	\N
e7a1fbb0-afdf-48ed-b98f-b1884ae6af2a	ace139f5-df59-48a0-ac68-fa5908e91be8	4109bc28-7127-40ea-9ec6-346aabb4a9ab	7	7257676	pending	\N	2025-11-23 13:10:49.980017	\N
1baab2aa-32de-4645-bafb-1369404200d2	ace139f5-df59-48a0-ac68-fa5908e91be8	4109bc28-7127-40ea-9ec6-346aabb4a9ab	8	7257676	pending	\N	2025-11-23 13:10:50.092033	\N
c87e74e1-57b2-4757-bb26-b567d3b8c3e9	ace139f5-df59-48a0-ac68-fa5908e91be8	4109bc28-7127-40ea-9ec6-346aabb4a9ab	9	7257676	pending	\N	2025-11-23 13:10:50.204204	\N
64708220-f433-47a1-acdf-d0f93621a21e	ace139f5-df59-48a0-ac68-fa5908e91be8	4109bc28-7127-40ea-9ec6-346aabb4a9ab	10	7257676	pending	\N	2025-11-23 13:10:50.316015	\N
2edbe677-f074-4d26-b0d5-64ca90f038c5	0b883bc6-7ed6-497d-beb8-2b582acf3697	85018248-ac0a-4ba5-84a7-9f633ffcd945	2	500	pending	\N	2025-11-23 13:15:45.082375	\N
822d76c1-2c0f-4c6b-b556-0a4952de0135	0b883bc6-7ed6-497d-beb8-2b582acf3697	85018248-ac0a-4ba5-84a7-9f633ffcd945	3	500	pending	\N	2025-11-23 13:15:45.195693	\N
05697745-2aca-49d2-a172-2ea5f6ca0725	0b883bc6-7ed6-497d-beb8-2b582acf3697	85018248-ac0a-4ba5-84a7-9f633ffcd945	4	500	pending	\N	2025-11-23 13:15:45.308945	\N
49e7bfbf-6ba8-4fde-9c48-e0b06d372aa5	0b883bc6-7ed6-497d-beb8-2b582acf3697	045979de-0553-4fc3-bfb3-fca7115593e9	2	500	pending	\N	2025-11-23 13:16:49.091079	\N
6182f3cb-32f6-4c86-aa6d-1f7437d249ba	0b883bc6-7ed6-497d-beb8-2b582acf3697	045979de-0553-4fc3-bfb3-fca7115593e9	3	500	pending	\N	2025-11-23 13:16:49.202601	\N
6a39ad55-66d1-45c1-8aeb-52778e70379b	0b883bc6-7ed6-497d-beb8-2b582acf3697	045979de-0553-4fc3-bfb3-fca7115593e9	4	500	pending	\N	2025-11-23 13:16:49.31436	\N
ebbbf873-910b-4474-94a7-dcd46732fa7b	0b883bc6-7ed6-497d-beb8-2b582acf3697	57708c05-b937-4c1d-9a62-5f1c1e1afa87	2	500	pending	\N	2025-11-23 13:16:59.854913	\N
c7c00052-6f83-4ec1-aab9-ee689fd8045e	0b883bc6-7ed6-497d-beb8-2b582acf3697	57708c05-b937-4c1d-9a62-5f1c1e1afa87	3	500	pending	\N	2025-11-23 13:16:59.984461	\N
e4271ca5-07d6-404a-8c59-ad5e62a00e16	0b883bc6-7ed6-497d-beb8-2b582acf3697	57708c05-b937-4c1d-9a62-5f1c1e1afa87	4	500	pending	\N	2025-11-23 13:17:00.097446	\N
74d98715-6b6e-4734-8ccc-f49f8df18edb	0b883bc6-7ed6-497d-beb8-2b582acf3697	85018248-ac0a-4ba5-84a7-9f633ffcd945	1	500	paid	2025-11-23	2025-11-23 13:15:44.968727	\N
c70140d4-7047-4b30-b173-f941d781e914	0b883bc6-7ed6-497d-beb8-2b582acf3697	045979de-0553-4fc3-bfb3-fca7115593e9	1	500	paid	2025-11-23	2025-11-23 13:16:48.979274	\N
17fd9b27-5f66-4649-bfb6-4ce7427d0b1e	ace139f5-df59-48a0-ac68-fa5908e91be8	4fcf8430-5bec-433a-a48f-0b05a9ca98c7	1	7257676	paid	2025-11-23	2025-11-23 13:10:38.829368	\N
7204964a-31ce-40c2-8474-1a032b0d6594	10de168e-136a-412a-88b9-2165d5df3a7c	3621c49b-7441-498f-a93b-ac60b9c385ad	1	754	paid	2025-11-23	2025-11-23 13:23:53.299563	\N
298ace46-bc27-4904-8087-7452a10e24b3	10de168e-136a-412a-88b9-2165d5df3a7c	3621c49b-7441-498f-a93b-ac60b9c385ad	2	754	paid	2025-11-23	2025-11-23 13:23:53.416831	\N
c2685915-af10-44af-94fc-806eb4ec0fac	3b5adf7d-75e4-449b-8216-092d9d4317f8	3e0e41f5-91ff-4c1d-be65-ac858627583a	1	56454	paid	2025-11-23	2025-11-23 13:21:16.743848	\N
3c1f6b66-5b78-4604-9d27-64c9aebdbd2d	3b5adf7d-75e4-449b-8216-092d9d4317f8	2c56a64b-602b-442b-8d7b-73edc39c4161	1	56454	paid	2025-11-23	2025-11-23 13:22:04.581691	\N
7918f86e-04a9-45df-a851-c0ce1271afae	10de168e-136a-412a-88b9-2165d5df3a7c	3621c49b-7441-498f-a93b-ac60b9c385ad	3	754	paid	2025-11-23	2025-11-23 13:23:53.536401	\N
fd5a0708-1df0-4380-82bd-9ea10f4775fe	3b5adf7d-75e4-449b-8216-092d9d4317f8	176756aa-6217-45c9-bc63-7f365ddd0988	1	56454	paid	2025-11-23	2025-11-23 13:21:56.557639	\N
ddb785d5-cd34-4839-b381-e0ae00dd6ad1	0b883bc6-7ed6-497d-beb8-2b582acf3697	57708c05-b937-4c1d-9a62-5f1c1e1afa87	1	500	paid	2025-11-23	2025-11-23 13:16:59.741501	\N
0957e7b8-10b1-480a-bfda-2231fed5f567	3b5adf7d-75e4-449b-8216-092d9d4317f8	3e0e41f5-91ff-4c1d-be65-ac858627583a	2	56454	pending	\N	2025-11-23 13:21:16.85854	\N
98a01e5b-6bfb-4784-8ead-6044a1097d61	3b5adf7d-75e4-449b-8216-092d9d4317f8	3e0e41f5-91ff-4c1d-be65-ac858627583a	3	56454	pending	\N	2025-11-23 13:21:16.971931	\N
065999e2-d5db-4e97-a789-1aa217d65d18	3b5adf7d-75e4-449b-8216-092d9d4317f8	3e0e41f5-91ff-4c1d-be65-ac858627583a	4	56454	pending	\N	2025-11-23 13:21:17.085823	\N
652e6c59-af83-4f9e-a81a-b3cc29f2fa86	3b5adf7d-75e4-449b-8216-092d9d4317f8	3e0e41f5-91ff-4c1d-be65-ac858627583a	5	56454	pending	\N	2025-11-23 13:21:17.199173	\N
633e3ab5-9f1f-4f47-885c-4077610eb54f	3b5adf7d-75e4-449b-8216-092d9d4317f8	176756aa-6217-45c9-bc63-7f365ddd0988	2	56454	pending	\N	2025-11-23 13:21:56.672292	\N
5c49ac8e-16ac-44c3-9836-0664494940e5	3b5adf7d-75e4-449b-8216-092d9d4317f8	176756aa-6217-45c9-bc63-7f365ddd0988	3	56454	pending	\N	2025-11-23 13:21:56.78652	\N
72ae71c4-be2f-47bc-94c3-5263c11875e3	3b5adf7d-75e4-449b-8216-092d9d4317f8	176756aa-6217-45c9-bc63-7f365ddd0988	4	56454	pending	\N	2025-11-23 13:21:56.901238	\N
f693739a-15f9-416c-8ca3-4a73b994c867	3b5adf7d-75e4-449b-8216-092d9d4317f8	176756aa-6217-45c9-bc63-7f365ddd0988	5	56454	pending	\N	2025-11-23 13:21:57.01453	\N
10302314-6d11-433a-9735-58b9a4bac5e7	3b5adf7d-75e4-449b-8216-092d9d4317f8	2c56a64b-602b-442b-8d7b-73edc39c4161	2	56454	pending	\N	2025-11-23 13:22:04.693942	\N
c458762e-e3b3-473a-8a05-2d3c5a13cc88	3b5adf7d-75e4-449b-8216-092d9d4317f8	2c56a64b-602b-442b-8d7b-73edc39c4161	3	56454	pending	\N	2025-11-23 13:22:04.805611	\N
4cd1af41-8b47-44a5-9364-023b389e5587	3b5adf7d-75e4-449b-8216-092d9d4317f8	2c56a64b-602b-442b-8d7b-73edc39c4161	4	56454	pending	\N	2025-11-23 13:22:04.917951	\N
469addb4-be73-4c9c-bc46-d3bc0b0f1691	3b5adf7d-75e4-449b-8216-092d9d4317f8	2c56a64b-602b-442b-8d7b-73edc39c4161	5	56454	pending	\N	2025-11-23 13:22:05.029856	\N
68e67d15-3079-42a2-9ff7-015f31af31a3	10de168e-136a-412a-88b9-2165d5df3a7c	3621c49b-7441-498f-a93b-ac60b9c385ad	4	754	pending	\N	2025-11-23 13:23:53.649952	\N
a2fe22b6-daf5-4b84-b44c-16a8d15592e9	10de168e-136a-412a-88b9-2165d5df3a7c	3621c49b-7441-498f-a93b-ac60b9c385ad	5	754	pending	\N	2025-11-23 13:23:53.763346	\N
4ba01135-dcbe-4a83-8f5a-d34cc9b7a061	10de168e-136a-412a-88b9-2165d5df3a7c	3621c49b-7441-498f-a93b-ac60b9c385ad	6	754	pending	\N	2025-11-23 13:23:53.876652	\N
df3ea6f6-e40b-4eb3-8f44-98bd4c9d4adc	10de168e-136a-412a-88b9-2165d5df3a7c	3621c49b-7441-498f-a93b-ac60b9c385ad	7	754	pending	\N	2025-11-23 13:23:53.990123	\N
054270ab-46d8-4f67-a685-2158cf41a477	10de168e-136a-412a-88b9-2165d5df3a7c	3621c49b-7441-498f-a93b-ac60b9c385ad	8	754	pending	\N	2025-11-23 13:23:54.103207	\N
21cfe8c7-9a61-4e9a-8d15-af68b3f00fe8	10de168e-136a-412a-88b9-2165d5df3a7c	3621c49b-7441-498f-a93b-ac60b9c385ad	9	754	pending	\N	2025-11-23 13:23:54.216689	\N
73009bb6-2d7a-42c6-aff9-9f48538a6290	10de168e-136a-412a-88b9-2165d5df3a7c	3621c49b-7441-498f-a93b-ac60b9c385ad	10	754	pending	\N	2025-11-23 13:23:54.329983	\N
2b1189c2-58e9-4ab7-b153-ea8c9c956102	10de168e-136a-412a-88b9-2165d5df3a7c	1576c403-d420-4701-91eb-f7118091d266	4	754	pending	\N	2025-11-23 13:24:33.690561	\N
07f0bb24-bf96-4cec-9639-38ccf57ed07f	10de168e-136a-412a-88b9-2165d5df3a7c	1576c403-d420-4701-91eb-f7118091d266	5	754	pending	\N	2025-11-23 13:24:33.801971	\N
6a536da9-46b0-4892-8387-94378f622ce9	10de168e-136a-412a-88b9-2165d5df3a7c	1576c403-d420-4701-91eb-f7118091d266	6	754	pending	\N	2025-11-23 13:24:33.913633	\N
03c42e80-1d01-475a-96c7-8aa3a66b99ea	10de168e-136a-412a-88b9-2165d5df3a7c	1576c403-d420-4701-91eb-f7118091d266	7	754	pending	\N	2025-11-23 13:24:34.025478	\N
1e313c25-15ab-441f-bd45-4f8b899f93e2	10de168e-136a-412a-88b9-2165d5df3a7c	1576c403-d420-4701-91eb-f7118091d266	8	754	pending	\N	2025-11-23 13:24:34.137301	\N
f8d3b2af-2e03-4903-b36d-bdc4d87daa92	10de168e-136a-412a-88b9-2165d5df3a7c	1576c403-d420-4701-91eb-f7118091d266	9	754	pending	\N	2025-11-23 13:24:34.249153	\N
a1432c21-be52-468d-8cc5-84d81f8f8c4f	10de168e-136a-412a-88b9-2165d5df3a7c	1576c403-d420-4701-91eb-f7118091d266	10	754	pending	\N	2025-11-23 13:24:34.360714	\N
05090987-4995-4b3e-a5fc-9143dc19592f	10de168e-136a-412a-88b9-2165d5df3a7c	146a771e-d7f3-4ee0-b3c5-bf686a9a8a11	4	754	pending	\N	2025-11-23 13:24:42.93449	\N
4a83dfe4-7b9d-4d99-9260-b1bb513e8415	10de168e-136a-412a-88b9-2165d5df3a7c	146a771e-d7f3-4ee0-b3c5-bf686a9a8a11	5	754	pending	\N	2025-11-23 13:24:43.048508	\N
cabc68d1-55e7-43a8-8fee-6bc1c78ce827	10de168e-136a-412a-88b9-2165d5df3a7c	146a771e-d7f3-4ee0-b3c5-bf686a9a8a11	6	754	pending	\N	2025-11-23 13:24:43.162778	\N
da0a29b1-c0e5-422a-880e-7fe8187f3792	10de168e-136a-412a-88b9-2165d5df3a7c	146a771e-d7f3-4ee0-b3c5-bf686a9a8a11	7	754	pending	\N	2025-11-23 13:24:43.276413	\N
052b37e7-9f3c-45eb-916c-11d240585497	10de168e-136a-412a-88b9-2165d5df3a7c	146a771e-d7f3-4ee0-b3c5-bf686a9a8a11	8	754	pending	\N	2025-11-23 13:24:43.389982	\N
1e49e5bd-1cc2-4ffe-868c-7b2f51864bcf	10de168e-136a-412a-88b9-2165d5df3a7c	146a771e-d7f3-4ee0-b3c5-bf686a9a8a11	9	754	pending	\N	2025-11-23 13:24:43.503348	\N
1ef9f610-4ad9-462a-9800-c78114a175ce	10de168e-136a-412a-88b9-2165d5df3a7c	146a771e-d7f3-4ee0-b3c5-bf686a9a8a11	10	754	pending	\N	2025-11-23 13:24:43.616643	\N
398b9ee1-4e55-4ff8-859f-f04d827fe7b9	2a2eba54-dfeb-4170-abf8-56b08a453958	1fbad05f-a9ca-4ddb-8655-fed5df7c433e	1	755	pending	\N	2025-11-23 13:27:36.270917	\N
fc3a747b-683a-42ce-8638-06839ca02e25	2a2eba54-dfeb-4170-abf8-56b08a453958	1fbad05f-a9ca-4ddb-8655-fed5df7c433e	2	755	pending	\N	2025-11-23 13:27:36.389606	\N
73d10d47-18b1-4974-9e24-27ebd960553b	10de168e-136a-412a-88b9-2165d5df3a7c	1576c403-d420-4701-91eb-f7118091d266	1	754	paid	2025-11-23	2025-11-23 13:24:33.355687	\N
3b5b9fa4-fe6d-4bfb-aeae-57de305e5c73	10de168e-136a-412a-88b9-2165d5df3a7c	146a771e-d7f3-4ee0-b3c5-bf686a9a8a11	1	754	paid	2025-11-23	2025-11-23 13:24:42.592343	\N
28ba1fd2-ab6c-4ec6-8110-c0a088f67e1e	2a2eba54-dfeb-4170-abf8-56b08a453958	1fbad05f-a9ca-4ddb-8655-fed5df7c433e	3	755	pending	\N	2025-11-23 13:27:36.501218	\N
94234c83-480e-4349-9f7e-9171614353bd	2a2eba54-dfeb-4170-abf8-56b08a453958	1fbad05f-a9ca-4ddb-8655-fed5df7c433e	4	755	pending	\N	2025-11-23 13:27:36.613033	\N
dcfe8ed4-86a1-4b14-b6a0-2b23015e46b1	10de168e-136a-412a-88b9-2165d5df3a7c	1576c403-d420-4701-91eb-f7118091d266	2	754	paid	2025-11-23	2025-11-23 13:24:33.467371	\N
178cb49a-4c21-48cc-99e1-8915bc63eb13	10de168e-136a-412a-88b9-2165d5df3a7c	146a771e-d7f3-4ee0-b3c5-bf686a9a8a11	2	754	paid	2025-11-23	2025-11-23 13:24:42.706615	\N
f99e2a62-00a3-4983-88f3-83b66bf2c020	10de168e-136a-412a-88b9-2165d5df3a7c	1576c403-d420-4701-91eb-f7118091d266	3	754	paid	2025-11-23	2025-11-23 13:24:33.579013	\N
1db90ae1-b1d7-4f13-9b29-cad8ce6cd48b	10de168e-136a-412a-88b9-2165d5df3a7c	146a771e-d7f3-4ee0-b3c5-bf686a9a8a11	3	754	paid	2025-11-23	2025-11-23 13:24:42.820354	\N
15808ba4-eb12-4f49-b545-0322ca5dd492	2a2eba54-dfeb-4170-abf8-56b08a453958	82a585b4-958d-4a07-baaf-02d3c2d1ffe0	2	755	pending	\N	2025-11-23 13:26:56.680901	\N
d5f4f4aa-3967-48fb-b996-9dd1e1dbcf58	2a2eba54-dfeb-4170-abf8-56b08a453958	82a585b4-958d-4a07-baaf-02d3c2d1ffe0	3	755	pending	\N	2025-11-23 13:26:56.794062	\N
fd73c9ae-126c-49b8-9179-fc3f0c0277c5	2a2eba54-dfeb-4170-abf8-56b08a453958	82a585b4-958d-4a07-baaf-02d3c2d1ffe0	4	755	pending	\N	2025-11-23 13:26:56.907089	\N
ff0912cf-917f-4908-8c4b-5636c56d4d76	2a2eba54-dfeb-4170-abf8-56b08a453958	9f953da7-7a9d-4945-bd7f-e2ee32eb8ef2	1	755	pending	\N	2025-11-23 13:27:29.530584	\N
6156cf13-6964-41fa-9614-457bba63a47c	2a2eba54-dfeb-4170-abf8-56b08a453958	9f953da7-7a9d-4945-bd7f-e2ee32eb8ef2	2	755	pending	\N	2025-11-23 13:27:29.642453	\N
2a194904-2c7b-4cd0-9ccb-46b934adc58d	2a2eba54-dfeb-4170-abf8-56b08a453958	9f953da7-7a9d-4945-bd7f-e2ee32eb8ef2	3	755	pending	\N	2025-11-23 13:27:29.754019	\N
b8797c2f-9d3d-4cc0-9153-c07cb0562e0e	2a2eba54-dfeb-4170-abf8-56b08a453958	9f953da7-7a9d-4945-bd7f-e2ee32eb8ef2	4	755	pending	\N	2025-11-23 13:27:29.865735	\N
ea8bfd2d-0df2-4f66-9485-0a9bc0bbfbcc	2a2eba54-dfeb-4170-abf8-56b08a453958	37ab08ae-b301-4786-b933-cf98619d75e0	1	755	pending	\N	2025-11-23 13:27:54.017714	\N
62b0f0e2-231d-4a94-b981-13b167f43cff	2a2eba54-dfeb-4170-abf8-56b08a453958	37ab08ae-b301-4786-b933-cf98619d75e0	2	755	pending	\N	2025-11-23 13:27:54.129464	\N
ce54c97c-3e62-4665-9dde-b56128f9b849	2a2eba54-dfeb-4170-abf8-56b08a453958	37ab08ae-b301-4786-b933-cf98619d75e0	3	755	pending	\N	2025-11-23 13:27:54.242293	\N
70c6128f-a13a-4bee-968b-694597a29f97	2a2eba54-dfeb-4170-abf8-56b08a453958	37ab08ae-b301-4786-b933-cf98619d75e0	4	755	pending	\N	2025-11-23 13:27:54.358994	\N
4f9aff55-dccd-4216-aa93-b4a7969097b1	2a2eba54-dfeb-4170-abf8-56b08a453958	5cd22902-4bda-4a31-91ba-113df09d3217	1	755	pending	\N	2025-11-23 13:30:04.976129	\N
6a69988a-0eb8-426d-a36f-65884f3edee8	2a2eba54-dfeb-4170-abf8-56b08a453958	5cd22902-4bda-4a31-91ba-113df09d3217	2	755	pending	\N	2025-11-23 13:30:05.088921	\N
484f4660-575c-426c-9ea2-f284e66c256b	2a2eba54-dfeb-4170-abf8-56b08a453958	5cd22902-4bda-4a31-91ba-113df09d3217	3	755	pending	\N	2025-11-23 13:30:05.200958	\N
2dfbf674-3882-4aa2-85f0-4f8d65b7f537	2a2eba54-dfeb-4170-abf8-56b08a453958	5cd22902-4bda-4a31-91ba-113df09d3217	4	755	pending	\N	2025-11-23 13:30:05.312978	\N
adadaa96-4b4a-4f84-b22b-53064a2339c2	2a2eba54-dfeb-4170-abf8-56b08a453958	82a585b4-958d-4a07-baaf-02d3c2d1ffe0	1	755	paid	2025-11-23	2025-11-23 13:26:56.566877	\N
70ddc98b-fafb-481f-aa30-dd2804a93db0	ace8e656-123e-4aa3-b017-fab2333e6342	c855ec60-c0eb-4052-bc07-3e8299ebc2a6	1	5000	pending	\N	2025-11-23 14:54:07.586014	\N
8455f3d1-4a9e-4390-bd21-ad5d3734830d	ace8e656-123e-4aa3-b017-fab2333e6342	c855ec60-c0eb-4052-bc07-3e8299ebc2a6	2	5000	pending	\N	2025-11-23 14:54:07.701771	\N
0aca1863-015b-4c57-9488-f56a9c04275a	ace8e656-123e-4aa3-b017-fab2333e6342	c855ec60-c0eb-4052-bc07-3e8299ebc2a6	3	5000	pending	\N	2025-11-23 14:54:07.815082	\N
3bf52572-e038-49a7-b482-0260a5d9a81a	ace8e656-123e-4aa3-b017-fab2333e6342	c855ec60-c0eb-4052-bc07-3e8299ebc2a6	4	5000	pending	\N	2025-11-23 14:54:07.92783	\N
db94c526-2531-43f0-80ee-ce327951676f	ace8e656-123e-4aa3-b017-fab2333e6342	c855ec60-c0eb-4052-bc07-3e8299ebc2a6	5	5000	pending	\N	2025-11-23 14:54:08.040275	\N
f2dd867d-540c-4abb-8737-8fe98d7f98ea	ace8e656-123e-4aa3-b017-fab2333e6342	c855ec60-c0eb-4052-bc07-3e8299ebc2a6	6	5000	pending	\N	2025-11-23 14:54:08.153389	\N
74af38fe-df61-4160-a5b3-8bbd10362519	ace8e656-123e-4aa3-b017-fab2333e6342	c855ec60-c0eb-4052-bc07-3e8299ebc2a6	7	5000	pending	\N	2025-11-23 14:54:08.266854	\N
d789ea26-ccf2-4642-af4e-b67803d428c5	ace8e656-123e-4aa3-b017-fab2333e6342	c855ec60-c0eb-4052-bc07-3e8299ebc2a6	8	5000	pending	\N	2025-11-23 14:54:08.380467	\N
e5dd3dad-7ff1-47fc-a2a3-6198fc5658f7	ace8e656-123e-4aa3-b017-fab2333e6342	c855ec60-c0eb-4052-bc07-3e8299ebc2a6	9	5000	pending	\N	2025-11-23 14:54:08.494066	\N
8c1b0256-b9e4-4741-bbb4-5c3856c10811	ace8e656-123e-4aa3-b017-fab2333e6342	c855ec60-c0eb-4052-bc07-3e8299ebc2a6	10	5000	pending	\N	2025-11-23 14:54:08.606501	\N
a91cc01f-0216-46ed-88a2-9a2df447a359	91a47d4c-c362-4425-96bb-e68322c24df3	996140be-81bd-48b3-8163-959aeeefb382	1	5000	pending	\N	2025-11-23 14:59:27.123379	\N
843baddf-39da-4932-a867-ff0a04d487d6	91a47d4c-c362-4425-96bb-e68322c24df3	996140be-81bd-48b3-8163-959aeeefb382	2	5000	pending	\N	2025-11-23 14:59:27.239193	\N
522dd6f5-a754-4504-9a7a-5ac794407b05	91a47d4c-c362-4425-96bb-e68322c24df3	996140be-81bd-48b3-8163-959aeeefb382	3	5000	pending	\N	2025-11-23 14:59:27.354292	\N
fff2eeee-30de-43d8-9ab4-488c4b389166	91a47d4c-c362-4425-96bb-e68322c24df3	996140be-81bd-48b3-8163-959aeeefb382	4	5000	pending	\N	2025-11-23 14:59:27.466487	\N
c910afda-edae-4bd5-bae1-3d7abee27fb7	91a47d4c-c362-4425-96bb-e68322c24df3	996140be-81bd-48b3-8163-959aeeefb382	5	5000	pending	\N	2025-11-23 14:59:27.578906	\N
4287ad78-2ea4-4ea5-a8b7-77ad3a272b3f	91a47d4c-c362-4425-96bb-e68322c24df3	996140be-81bd-48b3-8163-959aeeefb382	6	5000	pending	\N	2025-11-23 14:59:27.691396	\N
564014b4-32c2-491d-8dbe-179ca3f917c0	91a47d4c-c362-4425-96bb-e68322c24df3	996140be-81bd-48b3-8163-959aeeefb382	7	5000	pending	\N	2025-11-23 14:59:27.806314	\N
178867bd-60d1-4cb8-816c-c51eecbccc14	91a47d4c-c362-4425-96bb-e68322c24df3	996140be-81bd-48b3-8163-959aeeefb382	8	5000	pending	\N	2025-11-23 14:59:27.921977	\N
e107dd3f-9562-4f0d-a895-4ad7364461be	91a47d4c-c362-4425-96bb-e68322c24df3	996140be-81bd-48b3-8163-959aeeefb382	9	5000	pending	\N	2025-11-23 14:59:28.034059	\N
98192a25-6a92-42e6-94fc-2bce47b602d7	91a47d4c-c362-4425-96bb-e68322c24df3	996140be-81bd-48b3-8163-959aeeefb382	10	5000	pending	\N	2025-11-23 14:59:28.14637	\N
737f5813-dbac-4e0f-9810-45b12d0f08ab	9119b9d9-84b4-4c28-8fdf-c3576f826892	a0028a78-f813-4e13-bcb9-fe3748c2a0bc	1	10000	pending	\N	2025-11-23 15:07:44.289906	\N
a1ee2bea-49c3-4b70-9dcf-ec3b55d8b33c	9119b9d9-84b4-4c28-8fdf-c3576f826892	a0028a78-f813-4e13-bcb9-fe3748c2a0bc	2	10000	pending	\N	2025-11-23 15:07:44.411449	\N
1de38663-c57d-4671-b192-80e0c18f92c7	9119b9d9-84b4-4c28-8fdf-c3576f826892	a0028a78-f813-4e13-bcb9-fe3748c2a0bc	3	10000	pending	\N	2025-11-23 15:07:44.52728	\N
0870f6fc-17cc-453f-89de-4319b1d22dba	9119b9d9-84b4-4c28-8fdf-c3576f826892	a0028a78-f813-4e13-bcb9-fe3748c2a0bc	4	10000	pending	\N	2025-11-23 15:07:44.642066	\N
55eb463c-ba62-45bf-8164-aee1abeddabd	9119b9d9-84b4-4c28-8fdf-c3576f826892	a0028a78-f813-4e13-bcb9-fe3748c2a0bc	5	10000	pending	\N	2025-11-23 15:07:44.755587	\N
57f60e16-2f55-43de-a4f1-429251938df8	9119b9d9-84b4-4c28-8fdf-c3576f826892	a0028a78-f813-4e13-bcb9-fe3748c2a0bc	6	10000	pending	\N	2025-11-23 15:07:44.868964	\N
58cc3492-7127-48e0-8b34-5ebf12e4f679	9119b9d9-84b4-4c28-8fdf-c3576f826892	a0028a78-f813-4e13-bcb9-fe3748c2a0bc	7	10000	pending	\N	2025-11-23 15:07:44.988083	\N
3e967be2-3f05-41b6-b4fc-94abbcb98ac3	9119b9d9-84b4-4c28-8fdf-c3576f826892	a0028a78-f813-4e13-bcb9-fe3748c2a0bc	8	10000	pending	\N	2025-11-23 15:07:45.10284	\N
98e0bf96-61c5-4671-b5ca-3b280ef7e276	9119b9d9-84b4-4c28-8fdf-c3576f826892	a0028a78-f813-4e13-bcb9-fe3748c2a0bc	9	10000	pending	\N	2025-11-23 15:07:45.217871	\N
a097be60-5ae9-47cf-b1d3-484a2d2f66a4	9119b9d9-84b4-4c28-8fdf-c3576f826892	a0028a78-f813-4e13-bcb9-fe3748c2a0bc	10	10000	pending	\N	2025-11-23 15:07:45.331616	\N
b4b73525-3993-421b-bcd3-3a9c7f95f04f	898ba600-e79f-42a6-81e3-07c212754ae1	60f49f33-f80e-4aa8-9bd2-ddefbb317dd6	1	5000	pending	\N	2025-11-23 17:51:18.442556	\N
abc134be-d1f9-46e6-b558-09763e06be30	898ba600-e79f-42a6-81e3-07c212754ae1	60f49f33-f80e-4aa8-9bd2-ddefbb317dd6	2	5000	pending	\N	2025-11-23 17:51:18.556889	\N
163ddceb-7803-4060-81e7-1cf440c66ee0	898ba600-e79f-42a6-81e3-07c212754ae1	60f49f33-f80e-4aa8-9bd2-ddefbb317dd6	3	5000	pending	\N	2025-11-23 17:51:18.66935	\N
ab6d4ed6-e12f-43d5-a123-f31198a50e8c	898ba600-e79f-42a6-81e3-07c212754ae1	60f49f33-f80e-4aa8-9bd2-ddefbb317dd6	4	5000	pending	\N	2025-11-23 17:51:18.782532	\N
891a1335-6950-4664-99cf-0b2ae5ad8996	898ba600-e79f-42a6-81e3-07c212754ae1	60f49f33-f80e-4aa8-9bd2-ddefbb317dd6	5	5000	pending	\N	2025-11-23 17:51:18.896397	\N
26016ca5-0616-44b8-b59d-ac41a4ab74bc	898ba600-e79f-42a6-81e3-07c212754ae1	60f49f33-f80e-4aa8-9bd2-ddefbb317dd6	6	5000	pending	\N	2025-11-23 17:51:19.00892	\N
4ba57e78-fb61-4c16-aa73-513ceaf3068c	898ba600-e79f-42a6-81e3-07c212754ae1	60f49f33-f80e-4aa8-9bd2-ddefbb317dd6	7	5000	pending	\N	2025-11-23 17:51:19.121843	\N
7e5ca6b7-daf1-4422-8ecb-6ba5160deffe	898ba600-e79f-42a6-81e3-07c212754ae1	60f49f33-f80e-4aa8-9bd2-ddefbb317dd6	8	5000	pending	\N	2025-11-23 17:51:19.236782	\N
f94e29a9-7b59-40d8-be65-945b56eeabd2	898ba600-e79f-42a6-81e3-07c212754ae1	60f49f33-f80e-4aa8-9bd2-ddefbb317dd6	9	5000	pending	\N	2025-11-23 17:51:19.349335	\N
58d017f1-ce95-4184-b40d-5f54332e631a	898ba600-e79f-42a6-81e3-07c212754ae1	60f49f33-f80e-4aa8-9bd2-ddefbb317dd6	10	5000	pending	\N	2025-11-23 17:51:19.462355	\N
2eac068c-70c1-449a-9aba-a87fd7117a5d	baedd43c-715b-4dd4-92fa-7f7b294c4edd	8899eea4-e0ff-4e8e-a886-f0243ec7f55f	1	10000	pending	\N	2025-11-23 17:55:43.539645	\N
04aa4277-3353-41dc-b5e3-6e6624af3053	baedd43c-715b-4dd4-92fa-7f7b294c4edd	8899eea4-e0ff-4e8e-a886-f0243ec7f55f	2	10000	pending	\N	2025-11-23 17:55:43.652938	\N
378aee88-d584-45f1-b408-68d7b53c4622	baedd43c-715b-4dd4-92fa-7f7b294c4edd	8899eea4-e0ff-4e8e-a886-f0243ec7f55f	3	10000	pending	\N	2025-11-23 17:55:43.766421	\N
61062037-c5df-478b-bc9b-5388b271af9b	baedd43c-715b-4dd4-92fa-7f7b294c4edd	8899eea4-e0ff-4e8e-a886-f0243ec7f55f	4	10000	pending	\N	2025-11-23 17:55:43.87957	\N
93f54b26-f009-409e-afbe-a21776ddf3be	baedd43c-715b-4dd4-92fa-7f7b294c4edd	8899eea4-e0ff-4e8e-a886-f0243ec7f55f	5	10000	pending	\N	2025-11-23 17:55:43.992836	\N
a0d568e1-2598-4cd9-9b98-4ec61cb00a10	baedd43c-715b-4dd4-92fa-7f7b294c4edd	8899eea4-e0ff-4e8e-a886-f0243ec7f55f	6	10000	pending	\N	2025-11-23 17:55:44.10622	\N
d2987366-f43f-4ac0-b155-3a64031486d3	baedd43c-715b-4dd4-92fa-7f7b294c4edd	8899eea4-e0ff-4e8e-a886-f0243ec7f55f	7	10000	pending	\N	2025-11-23 17:55:44.219494	\N
55362c45-b721-419b-832a-73c0101237e1	baedd43c-715b-4dd4-92fa-7f7b294c4edd	8899eea4-e0ff-4e8e-a886-f0243ec7f55f	8	10000	pending	\N	2025-11-23 17:55:44.332346	\N
dd578402-ef0f-498a-830e-2ca097091116	baedd43c-715b-4dd4-92fa-7f7b294c4edd	8899eea4-e0ff-4e8e-a886-f0243ec7f55f	9	10000	pending	\N	2025-11-23 17:55:44.445179	\N
bcc7c79b-1f62-4b51-98f9-7b493a63337a	baedd43c-715b-4dd4-92fa-7f7b294c4edd	8899eea4-e0ff-4e8e-a886-f0243ec7f55f	10	10000	pending	\N	2025-11-23 17:55:44.557876	\N
1f0416ab-0702-49cb-b5fe-1e31e8bd67ed	4ae0e524-b5c3-490a-928c-cd9d92c9bd54	3a4eec3c-8c70-4109-bedf-98c93a4f1f0d	1	5000	pending	\N	2025-11-23 18:34:05.640374	\N
827d7bb0-fd22-4b0f-9649-c6eb79ef95d6	4ae0e524-b5c3-490a-928c-cd9d92c9bd54	3a4eec3c-8c70-4109-bedf-98c93a4f1f0d	2	5000	pending	\N	2025-11-23 18:34:05.7581	\N
2c355a32-e73b-4e44-8eaa-af0ecffb8ed3	4ae0e524-b5c3-490a-928c-cd9d92c9bd54	3a4eec3c-8c70-4109-bedf-98c93a4f1f0d	3	5000	pending	\N	2025-11-23 18:34:05.870267	\N
0f6ae8b6-b4ba-444c-aa01-a08b76a7436b	4ae0e524-b5c3-490a-928c-cd9d92c9bd54	3a4eec3c-8c70-4109-bedf-98c93a4f1f0d	4	5000	pending	\N	2025-11-23 18:34:05.981199	\N
624a04a4-e25e-4549-a785-1baefeac0019	4ae0e524-b5c3-490a-928c-cd9d92c9bd54	3a4eec3c-8c70-4109-bedf-98c93a4f1f0d	5	5000	pending	\N	2025-11-23 18:34:06.092336	\N
381b3ddf-3e73-40ff-be61-acc04c12af07	4ae0e524-b5c3-490a-928c-cd9d92c9bd54	3a4eec3c-8c70-4109-bedf-98c93a4f1f0d	6	5000	pending	\N	2025-11-23 18:34:06.203589	\N
0e436601-3405-4793-bdb9-f8cbd05a639f	4ae0e524-b5c3-490a-928c-cd9d92c9bd54	3a4eec3c-8c70-4109-bedf-98c93a4f1f0d	7	5000	pending	\N	2025-11-23 18:34:06.315081	\N
da054dd6-3062-47e5-b84f-935d800da8e7	4ae0e524-b5c3-490a-928c-cd9d92c9bd54	3a4eec3c-8c70-4109-bedf-98c93a4f1f0d	8	5000	pending	\N	2025-11-23 18:34:06.432682	\N
cb76862c-3a87-4ef0-985b-361ea2210a97	4ae0e524-b5c3-490a-928c-cd9d92c9bd54	3a4eec3c-8c70-4109-bedf-98c93a4f1f0d	9	5000	pending	\N	2025-11-23 18:34:06.544823	\N
b9de4801-9ee0-4843-85b6-b54ab05e8895	4ae0e524-b5c3-490a-928c-cd9d92c9bd54	3a4eec3c-8c70-4109-bedf-98c93a4f1f0d	10	5000	pending	\N	2025-11-23 18:34:06.66423	\N
ce5d7403-a46c-4858-8c82-2670c24e13bb	0eda30f9-e040-453c-a809-f45d8c8e7b38	0fed6a54-bab6-4d0f-8b1e-378c39669543	2	10000	pending	\N	2025-11-23 20:44:51.996345	\N
0948b27d-9451-463f-8b6a-08dbf26577a3	0eda30f9-e040-453c-a809-f45d8c8e7b38	0fed6a54-bab6-4d0f-8b1e-378c39669543	3	10000	pending	\N	2025-11-23 20:44:52.110251	\N
30784db2-19c2-4106-9c67-186d1cfe4ef2	0eda30f9-e040-453c-a809-f45d8c8e7b38	0fed6a54-bab6-4d0f-8b1e-378c39669543	4	10000	pending	\N	2025-11-23 20:44:52.223443	\N
c3964891-d724-4f46-9623-1d4402f1f5f8	0eda30f9-e040-453c-a809-f45d8c8e7b38	2a0ee7ec-7561-4934-a768-1036ac2b99dd	1	10000	pending	\N	2025-11-23 20:46:22.267142	\N
6abfe6b5-811a-4b7a-9df9-9fb0246ed29b	0eda30f9-e040-453c-a809-f45d8c8e7b38	2a0ee7ec-7561-4934-a768-1036ac2b99dd	2	10000	pending	\N	2025-11-23 20:46:22.378857	\N
eab2ccad-b9ba-4fac-a733-3bedecf34454	0eda30f9-e040-453c-a809-f45d8c8e7b38	2a0ee7ec-7561-4934-a768-1036ac2b99dd	3	10000	pending	\N	2025-11-23 20:46:22.490312	\N
75264964-6dcd-41e1-8ec6-db544b91b5bd	0eda30f9-e040-453c-a809-f45d8c8e7b38	2a0ee7ec-7561-4934-a768-1036ac2b99dd	4	10000	pending	\N	2025-11-23 20:46:22.601567	\N
44881cba-2f0c-4d93-8cb6-f2d7e061df2a	0eda30f9-e040-453c-a809-f45d8c8e7b38	5fe89da5-4c9b-4fd4-972b-f5ff4df41730	1	10000	pending	\N	2025-11-23 20:46:33.447286	\N
535da861-a98d-49f4-a1dd-7c3f4e9c2f63	0eda30f9-e040-453c-a809-f45d8c8e7b38	5fe89da5-4c9b-4fd4-972b-f5ff4df41730	2	10000	pending	\N	2025-11-23 20:46:33.560363	\N
218fae51-face-4c2b-977e-abdda4bcfa51	0eda30f9-e040-453c-a809-f45d8c8e7b38	5fe89da5-4c9b-4fd4-972b-f5ff4df41730	3	10000	pending	\N	2025-11-23 20:46:33.673316	\N
b6120ff2-97ed-462a-8ea5-0f3782d624cf	0eda30f9-e040-453c-a809-f45d8c8e7b38	5fe89da5-4c9b-4fd4-972b-f5ff4df41730	4	10000	pending	\N	2025-11-23 20:46:33.787264	\N
fc060dfc-0414-4198-91e3-e9585b7c1cf6	0eda30f9-e040-453c-a809-f45d8c8e7b38	0fed6a54-bab6-4d0f-8b1e-378c39669543	1	10000	paid	2025-11-23	2025-11-23 20:44:51.879744	\N
0357ec62-b264-4715-93e2-32cf55a789fc	623c1a2f-fc12-4a03-a4a8-17561e16cb34	6cf1be8a-336b-4509-94be-56b31416cc6e	1	5000	pending	\N	2025-11-24 16:08:03.474421	\N
68c8f6c1-af9a-4229-9ad9-2142a9286720	623c1a2f-fc12-4a03-a4a8-17561e16cb34	6cf1be8a-336b-4509-94be-56b31416cc6e	2	5000	pending	\N	2025-11-24 16:08:03.588017	\N
644e7633-ed7c-4f3e-a058-da0630b47ac4	623c1a2f-fc12-4a03-a4a8-17561e16cb34	6cf1be8a-336b-4509-94be-56b31416cc6e	3	5000	pending	\N	2025-11-24 16:08:03.699966	\N
5e77f4d5-f874-4c71-8350-67d556138f39	623c1a2f-fc12-4a03-a4a8-17561e16cb34	6cf1be8a-336b-4509-94be-56b31416cc6e	4	5000	pending	\N	2025-11-24 16:08:03.809714	\N
94980a14-3eab-4e66-8895-a51b760faf18	623c1a2f-fc12-4a03-a4a8-17561e16cb34	6cf1be8a-336b-4509-94be-56b31416cc6e	5	5000	pending	\N	2025-11-24 16:08:03.920756	\N
868afa54-495a-41c1-b59c-7f5be8c7a25c	623c1a2f-fc12-4a03-a4a8-17561e16cb34	6cf1be8a-336b-4509-94be-56b31416cc6e	6	5000	pending	\N	2025-11-24 16:08:04.031255	\N
88d18581-5d15-4115-b502-102058043c12	623c1a2f-fc12-4a03-a4a8-17561e16cb34	6cf1be8a-336b-4509-94be-56b31416cc6e	7	5000	pending	\N	2025-11-24 16:08:04.14146	\N
743b2520-f2af-4226-a4bf-26f09eefbd5c	623c1a2f-fc12-4a03-a4a8-17561e16cb34	6cf1be8a-336b-4509-94be-56b31416cc6e	8	5000	pending	\N	2025-11-24 16:08:04.253672	\N
867e19f0-4a8b-4fe6-92a6-ee8cbaa1c0d2	623c1a2f-fc12-4a03-a4a8-17561e16cb34	6cf1be8a-336b-4509-94be-56b31416cc6e	9	5000	pending	\N	2025-11-24 16:08:04.363794	\N
22627aac-84b1-476a-856e-da7e5e0f0d50	623c1a2f-fc12-4a03-a4a8-17561e16cb34	6cf1be8a-336b-4509-94be-56b31416cc6e	10	5000	pending	\N	2025-11-24 16:08:04.473564	\N
df92348e-8637-4ec5-ade0-ced0318bf956	728cd1ea-8902-41da-b5b9-2c0c741ad221	2f16d19d-68f5-4d84-a568-724a2bc1444e	1	5000	pending	\N	2025-11-24 16:13:01.497717	\N
fceaa7f5-fe35-4a96-acab-39ae58b7d0b5	728cd1ea-8902-41da-b5b9-2c0c741ad221	2f16d19d-68f5-4d84-a568-724a2bc1444e	2	5000	pending	\N	2025-11-24 16:13:01.614552	\N
2021c26e-fb63-4bce-a946-26bedb853834	728cd1ea-8902-41da-b5b9-2c0c741ad221	2f16d19d-68f5-4d84-a568-724a2bc1444e	3	5000	pending	\N	2025-11-24 16:13:01.725915	\N
231c40ab-3888-415b-af19-14daeb690d8c	728cd1ea-8902-41da-b5b9-2c0c741ad221	2f16d19d-68f5-4d84-a568-724a2bc1444e	4	5000	pending	\N	2025-11-24 16:13:01.83769	\N
9d18501f-2b9a-4760-be81-f80c89bab22c	728cd1ea-8902-41da-b5b9-2c0c741ad221	2f16d19d-68f5-4d84-a568-724a2bc1444e	5	5000	pending	\N	2025-11-24 16:13:01.950853	\N
0662624e-f3b2-44fb-8c63-4ea11003fb58	728cd1ea-8902-41da-b5b9-2c0c741ad221	2f16d19d-68f5-4d84-a568-724a2bc1444e	6	5000	pending	\N	2025-11-24 16:13:02.060981	\N
e8616f31-13ce-4f16-b515-dc0c637e6692	728cd1ea-8902-41da-b5b9-2c0c741ad221	2f16d19d-68f5-4d84-a568-724a2bc1444e	7	5000	pending	\N	2025-11-24 16:13:02.173432	\N
c9da56c3-1638-45e6-bbdb-6a7e07141700	728cd1ea-8902-41da-b5b9-2c0c741ad221	2f16d19d-68f5-4d84-a568-724a2bc1444e	8	5000	pending	\N	2025-11-24 16:13:02.283491	\N
116e1c50-1293-45ff-b95f-f799c0c9dbef	728cd1ea-8902-41da-b5b9-2c0c741ad221	2f16d19d-68f5-4d84-a568-724a2bc1444e	9	5000	pending	\N	2025-11-24 16:13:02.395167	\N
9ac84ab0-ee83-4f13-bd76-79bf69525eaa	728cd1ea-8902-41da-b5b9-2c0c741ad221	2f16d19d-68f5-4d84-a568-724a2bc1444e	10	5000	pending	\N	2025-11-24 16:13:02.50673	\N
ed8f7ebc-509f-4c03-ba59-c1cb65f42de7	53c993fb-e8e3-4572-8056-8af9f3874127	0e27cd47-dcc0-462e-a812-d54afa591360	1	5000	pending	\N	2025-11-24 16:18:27.769154	\N
d1c78180-04d5-4b13-8364-58b338bdf151	53c993fb-e8e3-4572-8056-8af9f3874127	0e27cd47-dcc0-462e-a812-d54afa591360	2	5000	pending	\N	2025-11-24 16:18:27.881655	\N
dcf9eeea-6d2b-4f88-9800-e00144d845d5	53c993fb-e8e3-4572-8056-8af9f3874127	0e27cd47-dcc0-462e-a812-d54afa591360	3	5000	pending	\N	2025-11-24 16:18:27.991989	\N
93270b9f-be11-4536-a21b-85d492facb6a	53c993fb-e8e3-4572-8056-8af9f3874127	0e27cd47-dcc0-462e-a812-d54afa591360	4	5000	pending	\N	2025-11-24 16:18:28.10115	\N
825d4daf-5a4e-4f93-9327-d1fc46bbbad5	53c993fb-e8e3-4572-8056-8af9f3874127	0e27cd47-dcc0-462e-a812-d54afa591360	5	5000	pending	\N	2025-11-24 16:18:28.210818	\N
29663978-74ce-4746-b45e-0ab3cbb59409	53c993fb-e8e3-4572-8056-8af9f3874127	0e27cd47-dcc0-462e-a812-d54afa591360	6	5000	pending	\N	2025-11-24 16:18:28.320269	\N
97c441e9-6a0b-424b-a3db-6db5afb86d75	53c993fb-e8e3-4572-8056-8af9f3874127	0e27cd47-dcc0-462e-a812-d54afa591360	7	5000	pending	\N	2025-11-24 16:18:28.430266	\N
e78783a2-1520-49b0-8065-f4e00e903308	53c993fb-e8e3-4572-8056-8af9f3874127	0e27cd47-dcc0-462e-a812-d54afa591360	8	5000	pending	\N	2025-11-24 16:18:28.540694	\N
ca6ca60a-3f60-4efd-b995-95c6bc194360	53c993fb-e8e3-4572-8056-8af9f3874127	0e27cd47-dcc0-462e-a812-d54afa591360	9	5000	pending	\N	2025-11-24 16:18:28.65165	\N
60acf2e8-d108-4dc6-888b-f3a207ff16c1	53c993fb-e8e3-4572-8056-8af9f3874127	0e27cd47-dcc0-462e-a812-d54afa591360	10	5000	pending	\N	2025-11-24 16:18:28.763961	\N
d38d4230-db75-4b43-aa4c-714ea4b68712	dc2da884-64d8-4f7a-967f-add445fae554	821d0021-4f80-4ffb-b363-f1444bd10042	4	500	pending	\N	2025-11-24 16:31:36.810126	\N
846d6ac5-e121-409d-94a6-76d0547309a8	dc2da884-64d8-4f7a-967f-add445fae554	821d0021-4f80-4ffb-b363-f1444bd10042	5	500	pending	\N	2025-11-24 16:31:36.921578	\N
36a128d6-5264-47d8-81d4-50de0f9c4d5c	dc2da884-64d8-4f7a-967f-add445fae554	4e0cabd6-26e5-4eae-acb8-c5a1ecf4b2c5	4	500	pending	\N	2025-11-24 16:32:17.778356	\N
e7ead5b0-6952-488f-be7c-ca92fdb9fe1d	dc2da884-64d8-4f7a-967f-add445fae554	4e0cabd6-26e5-4eae-acb8-c5a1ecf4b2c5	5	500	pending	\N	2025-11-24 16:32:17.888477	\N
d7c17cda-14af-4ee3-b43b-f6928cfe6b07	dc2da884-64d8-4f7a-967f-add445fae554	9d91610e-6836-4c20-85c5-0b4efe847ebc	4	500	pending	\N	2025-11-24 16:32:28.211809	\N
c0623445-11bf-4a20-88cd-9c9686530d4f	dc2da884-64d8-4f7a-967f-add445fae554	9d91610e-6836-4c20-85c5-0b4efe847ebc	5	500	pending	\N	2025-11-24 16:32:28.322249	\N
76c87571-4300-43d9-8f3d-0f23c1a0fbf1	dc2da884-64d8-4f7a-967f-add445fae554	821d0021-4f80-4ffb-b363-f1444bd10042	3	500	paid	2025-11-24	2025-11-24 16:31:36.697706	\N
3078e22c-9873-46db-8320-1960976c62cb	dc2da884-64d8-4f7a-967f-add445fae554	4e0cabd6-26e5-4eae-acb8-c5a1ecf4b2c5	3	500	paid	2025-11-24	2025-11-24 16:32:17.669413	\N
2e4b3330-7803-4249-8a31-c2071065efd3	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	d076abf5-c0fd-45bf-981b-2a2e94a89d09	2	500	paid	2025-11-24	2025-11-21 14:05:07.366187	\N
59b2cbb5-2b12-4b75-a6dc-1d92846ecdd5	dc2da884-64d8-4f7a-967f-add445fae554	821d0021-4f80-4ffb-b363-f1444bd10042	2	500	paid	2025-11-24	2025-11-24 16:31:36.586198	\N
6c96a4ab-730c-40c0-9dc8-1c84bd5c8a71	dc2da884-64d8-4f7a-967f-add445fae554	821d0021-4f80-4ffb-b363-f1444bd10042	1	500	paid	2025-11-24	2025-11-24 16:31:36.473126	\N
1938b108-5bf7-4f09-aac0-252312d3c171	dc2da884-64d8-4f7a-967f-add445fae554	4e0cabd6-26e5-4eae-acb8-c5a1ecf4b2c5	1	500	paid	2025-11-24	2025-11-24 16:32:17.451108	\N
74d13d7a-0a61-4002-ae81-fe64471d7cbb	dc2da884-64d8-4f7a-967f-add445fae554	9d91610e-6836-4c20-85c5-0b4efe847ebc	1	500	paid	2025-11-24	2025-11-24 16:32:27.879997	\N
8587b5a6-6e68-482e-8c19-9095723fcdd6	dc2da884-64d8-4f7a-967f-add445fae554	4e0cabd6-26e5-4eae-acb8-c5a1ecf4b2c5	2	500	paid	2025-11-24	2025-11-24 16:32:17.560379	\N
d6a7d36f-0002-4308-9e5d-71a1549834f1	dc2da884-64d8-4f7a-967f-add445fae554	9d91610e-6836-4c20-85c5-0b4efe847ebc	2	500	paid	2025-11-24	2025-11-24 16:32:27.99085	\N
a618ce84-80c5-4672-a7c5-bb91565f536b	dc2da884-64d8-4f7a-967f-add445fae554	9d91610e-6836-4c20-85c5-0b4efe847ebc	3	500	paid	2025-11-24	2025-11-24 16:32:28.101318	\N
afe566c0-f9a1-40dc-92e2-436f3a4d4381	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	2aaa9fc8-8fe9-4df9-848f-3305ff6a895f	1	500	paid	2025-11-21	2025-11-21 14:03:49.403104	\N
9d8b7966-011f-4997-ab95-f7a29b876ce6	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	d076abf5-c0fd-45bf-981b-2a2e94a89d09	1	500	paid	2025-11-24	2025-11-21 14:05:07.252089	\N
3eec6bff-2123-4be4-ab22-589202d4a9cc	6024de73-8355-41d0-9a99-070cccc2eb0f	0da034e1-90ef-478a-b5a7-6571d7a6c694	1	500	pending	\N	2025-11-24 16:39:37.189399	\N
fddf10ed-edc1-4dd7-aecc-48a76cfaeaa3	6024de73-8355-41d0-9a99-070cccc2eb0f	0da034e1-90ef-478a-b5a7-6571d7a6c694	2	500	pending	\N	2025-11-24 16:39:37.302981	\N
361fa315-65dc-47b1-b9f8-7d9a96f905db	6024de73-8355-41d0-9a99-070cccc2eb0f	0da034e1-90ef-478a-b5a7-6571d7a6c694	3	500	pending	\N	2025-11-24 16:39:37.41238	\N
16efc3c1-caaa-4ae8-9973-b95412f8384c	971d53d8-625c-4c92-b974-2007962de683	8172b5ca-123c-4e31-be6c-602a291f411c	2	500	paid	2026-01-02	2025-11-24 17:19:26.892429	\N
f470f131-a595-40f9-b72f-2affdb3408fb	3cad8129-6fa9-41cd-b3b7-56e879760a0f	abd9b4c5-8d2c-4832-94a2-3efc32ff6ad7	1	5000	pending	\N	2025-11-25 21:20:01.747999	\N
cdb21f94-6d58-40f3-bcda-ff0680f2fa71	3cad8129-6fa9-41cd-b3b7-56e879760a0f	abd9b4c5-8d2c-4832-94a2-3efc32ff6ad7	2	5000	pending	\N	2025-11-25 21:20:01.863748	\N
3ac6c9e8-a2ac-41fe-a162-2c93025f4b70	3cad8129-6fa9-41cd-b3b7-56e879760a0f	abd9b4c5-8d2c-4832-94a2-3efc32ff6ad7	3	5000	pending	\N	2025-11-25 21:20:01.977058	\N
349731e9-9d72-4a3c-a26d-27100c91c6d8	3cad8129-6fa9-41cd-b3b7-56e879760a0f	abd9b4c5-8d2c-4832-94a2-3efc32ff6ad7	4	5000	pending	\N	2025-11-25 21:20:02.089701	\N
dc92fea6-2986-4905-9944-6537db392998	3cad8129-6fa9-41cd-b3b7-56e879760a0f	abd9b4c5-8d2c-4832-94a2-3efc32ff6ad7	5	5000	pending	\N	2025-11-25 21:20:02.201425	\N
16b125e0-f11b-47e4-97aa-fc967c4e945c	3cad8129-6fa9-41cd-b3b7-56e879760a0f	abd9b4c5-8d2c-4832-94a2-3efc32ff6ad7	6	5000	pending	\N	2025-11-25 21:20:02.314223	\N
8b827d02-3dac-48dd-9e01-55a4979055c1	3cad8129-6fa9-41cd-b3b7-56e879760a0f	abd9b4c5-8d2c-4832-94a2-3efc32ff6ad7	7	5000	pending	\N	2025-11-25 21:20:02.425653	\N
bded06b3-fcfb-43d2-a9b6-d6240af16e46	3cad8129-6fa9-41cd-b3b7-56e879760a0f	abd9b4c5-8d2c-4832-94a2-3efc32ff6ad7	8	5000	pending	\N	2025-11-25 21:20:02.540937	\N
93000800-0cdb-4300-b1dc-e04b627a1221	3cad8129-6fa9-41cd-b3b7-56e879760a0f	abd9b4c5-8d2c-4832-94a2-3efc32ff6ad7	9	5000	pending	\N	2025-11-25 21:20:02.652045	\N
2c645fe5-4c67-435c-b8f8-e7f79829f340	3cad8129-6fa9-41cd-b3b7-56e879760a0f	abd9b4c5-8d2c-4832-94a2-3efc32ff6ad7	10	5000	pending	\N	2025-11-25 21:20:02.763055	\N
f820b4cf-e896-46b9-a86d-3cebe871cd40	971d53d8-625c-4c92-b974-2007962de683	36d61c3c-df87-47a3-9f7d-5150bc4a07be	5	500	paid	2026-01-02	2026-01-02 16:47:00.839153	\N
d6edc577-32f6-486f-b759-eb09cbd970ed	971d53d8-625c-4c92-b974-2007962de683	b7786de7-d74d-4ca5-b808-643e38401feb	5	500	paid	2026-01-02	2026-01-02 16:47:00.859517	\N
fc332c69-df43-4d7b-9732-58185f839bac	971d53d8-625c-4c92-b974-2007962de683	10c84889-56b4-4252-a23d-4050c1ebc279	4	500	paid	2026-01-02	2025-11-24 17:20:16.095146	\N
0cff2d0d-c424-439e-97d0-7a2353ee2b99	971d53d8-625c-4c92-b974-2007962de683	361058a5-ede7-487a-8108-668fa7aea7d6	4	500	paid	2026-01-02	2025-11-24 17:20:35.182731	\N
ca41b0ef-62b5-4e91-954d-a729ce066b7f	971d53d8-625c-4c92-b974-2007962de683	8172b5ca-123c-4e31-be6c-602a291f411c	1	500	paid	2026-01-02	2025-11-24 17:19:26.777749	\N
730e6cec-456a-4156-aeea-b25ee80cdcb1	971d53d8-625c-4c92-b974-2007962de683	36d61c3c-df87-47a3-9f7d-5150bc4a07be	1	500	paid	2026-01-02	2025-11-24 17:19:53.474338	\N
45933b73-edf1-44a8-8db8-3da34bf2e87c	971d53d8-625c-4c92-b974-2007962de683	b7786de7-d74d-4ca5-b808-643e38401feb	1	500	paid	2026-01-02	2025-11-24 17:20:06.601022	\N
c46410bf-14ce-4924-bfc5-1f01de5db2c2	971d53d8-625c-4c92-b974-2007962de683	10c84889-56b4-4252-a23d-4050c1ebc279	1	500	paid	2026-01-02	2025-11-24 17:20:15.768819	\N
c6e53553-28bd-433d-bce2-099321d5107f	971d53d8-625c-4c92-b974-2007962de683	361058a5-ede7-487a-8108-668fa7aea7d6	1	500	paid	2026-01-02	2025-11-24 17:20:34.855186	\N
d29baa10-64f2-41ce-9f0a-168acc123fae	971d53d8-625c-4c92-b974-2007962de683	8172b5ca-123c-4e31-be6c-602a291f411c	4	500	paid	2026-01-02	2025-11-24 17:19:27.114675	\N
83092d27-5934-45de-8cc7-298e2452adf1	971d53d8-625c-4c92-b974-2007962de683	8172b5ca-123c-4e31-be6c-602a291f411c	3	500	paid	2026-01-02	2025-11-24 17:19:27.003855	\N
a8589ffb-1e52-481d-afcf-271009c83d75	971d53d8-625c-4c92-b974-2007962de683	36d61c3c-df87-47a3-9f7d-5150bc4a07be	3	500	paid	2026-01-02	2025-11-24 17:19:53.698199	\N
73284850-8a96-4b55-b731-ef5d33cdad41	971d53d8-625c-4c92-b974-2007962de683	b7786de7-d74d-4ca5-b808-643e38401feb	3	500	paid	2026-01-02	2025-11-24 17:20:06.819985	\N
cf57a7fd-a748-4bb5-bcd0-d6bfcec41ac1	971d53d8-625c-4c92-b974-2007962de683	36d61c3c-df87-47a3-9f7d-5150bc4a07be	2	500	paid	2026-01-02	2025-11-24 17:19:53.586541	\N
e4c5448d-f691-412f-bf51-c3fbc9145cb7	971d53d8-625c-4c92-b974-2007962de683	b7786de7-d74d-4ca5-b808-643e38401feb	2	500	paid	2026-01-02	2025-11-24 17:20:06.710711	\N
23bad55f-a9df-479e-8337-f1e082579326	971d53d8-625c-4c92-b974-2007962de683	10c84889-56b4-4252-a23d-4050c1ebc279	2	500	paid	2026-01-02	2025-11-24 17:20:15.87778	\N
aeb77744-0a08-455c-b9a3-0942376da56c	971d53d8-625c-4c92-b974-2007962de683	361058a5-ede7-487a-8108-668fa7aea7d6	2	500	paid	2026-01-02	2025-11-24 17:20:34.964413	\N
6531838e-405e-4d33-ace8-eff2d99d7d43	971d53d8-625c-4c92-b974-2007962de683	10c84889-56b4-4252-a23d-4050c1ebc279	3	500	paid	2026-01-02	2025-11-24 17:20:15.986414	\N
3b20b55c-d179-412f-bb79-80f2ac439db3	971d53d8-625c-4c92-b974-2007962de683	361058a5-ede7-487a-8108-668fa7aea7d6	3	500	paid	2026-01-02	2025-11-24 17:20:35.073896	\N
0ba6c238-0cf0-4928-8d69-fd295250dbcf	971d53d8-625c-4c92-b974-2007962de683	10c84889-56b4-4252-a23d-4050c1ebc279	5	500	paid	2026-01-02	2026-01-02 16:47:00.881818	\N
2c9bcbc0-c8a2-46cf-9208-6f551b5ffce3	971d53d8-625c-4c92-b974-2007962de683	361058a5-ede7-487a-8108-668fa7aea7d6	5	500	paid	2026-01-02	2026-01-02 16:47:00.902536	\N
ea648932-d2c9-412f-b189-52213eb7a403	30941dec-81b8-4056-b31d-232893170efd	83cf28bd-9944-4ade-834d-aceb791feb5e	1	500	pending	\N	2026-01-02 19:40:42.997482	\N
33ffe80c-2acd-4d73-b16b-36a48200d6c6	971d53d8-625c-4c92-b974-2007962de683	36d61c3c-df87-47a3-9f7d-5150bc4a07be	4	500	paid	2026-01-02	2025-11-24 17:19:53.810369	\N
84644a98-2366-4c95-a385-d9e1bc5bf77b	971d53d8-625c-4c92-b974-2007962de683	b7786de7-d74d-4ca5-b808-643e38401feb	4	500	paid	2026-01-02	2025-11-24 17:20:06.929179	\N
1933ca09-dba9-4266-82e6-e346a46395e5	971d53d8-625c-4c92-b974-2007962de683	8172b5ca-123c-4e31-be6c-602a291f411c	5	500	paid	2026-01-02	2026-01-02 16:47:00.811514	\N
2f1acb71-f8db-4dc6-ab8d-5aaae0f1cfad	30941dec-81b8-4056-b31d-232893170efd	83cf28bd-9944-4ade-834d-aceb791feb5e	2	500	pending	\N	2026-01-02 19:40:43.022984	\N
42a16f56-cc6d-4970-906d-edb8c0da1d8d	30941dec-81b8-4056-b31d-232893170efd	83cf28bd-9944-4ade-834d-aceb791feb5e	3	500	pending	\N	2026-01-02 19:40:43.04545	\N
e9f35804-2f56-413f-af1d-f64f695e9741	13240fad-b20a-4412-be5e-3fbe1649fd35	eb8cbe15-3923-48ff-9999-e2b8db64c8f5	1	500	pending	\N	2026-01-02 19:53:29.465556	\N
316583e0-f779-4fa5-89df-497f2ea3c468	13240fad-b20a-4412-be5e-3fbe1649fd35	eb8cbe15-3923-48ff-9999-e2b8db64c8f5	2	500	pending	\N	2026-01-02 19:53:29.486725	\N
7a9fdf26-40bb-4f2b-8266-140482a5d66d	13240fad-b20a-4412-be5e-3fbe1649fd35	eb8cbe15-3923-48ff-9999-e2b8db64c8f5	3	500	pending	\N	2026-01-02 19:53:29.51232	\N
\.


--
-- Data for Name: data_exports; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.data_exports (id, user_id, export_type, status, file_url, file_name, file_size, expires_at, error_message, requested_at, completed_at) FROM stdin;
4e9df758-7571-4817-af36-6e00ca23ed31	55a302a3-05bb-45dd-a298-c90cd9a00cd8	contributions	completed	/api/exports/4e9df758-7571-4817-af36-6e00ca23ed31/download	export_55a302a3-05bb-45dd-a298-c90cd9a00cd8_1764341512278.csv	72	2025-12-05 14:51:52.279	\N	2025-11-28 14:51:52.029159	2025-11-28 14:51:52.279
\.


--
-- Data for Name: device_tokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.device_tokens (id, user_id, token, platform, device_name, is_active, last_used, created_at) FROM stdin;
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.groups (id, name, contribution_amount, frequency, status, current_cycle, total_cycles, next_collection_date, start_date, created_at, currency, user_id, visibility, max_members, go_live_date, is_live, completed_at, adjusted_go_live_date, payout_medium, schedule_visibility, recipient_visibility) FROM stdin;
0b32fd7f-1b17-458f-8a9c-ad592c8b036e	Test	500	monthly	active	3	3	2026-01-27	2025-11-21	2025-11-21 11:08:34.347706	GBP	49819811	closed	\N	2025-11-23 12:07:00	1	2025-11-21 11:34:59.433	2025-11-23 12:18:59.361	cycle_receiver	1	1
3cad8129-6fa9-41cd-b3b7-56e879760a0f	Test Group 0jp-Y3	5000	weekly	pending	1	10	2025-11-18	2025-11-25	2025-11-25 21:20:01.396521	NGN	481e91e3-c87a-44b1-b0ab-032a71a9f084	closed	\N	2025-11-25 22:19:00	0	\N	\N	cycle_receiver	1	1
3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	Test	500	weekly	completed	3	3	2025-12-12	2025-11-21	2025-11-21 14:03:49.056951	USD	49819811	closed	\N	2025-11-23 15:02:00	1	2025-11-28 18:03:56.063	2025-11-21 14:07:37.317	cycle_receiver	1	1
ace139f5-df59-48a0-ac68-fa5908e91be8	ghktktkkt	7257676	weekly	active	3	3	2026-01-07	2025-11-23	2025-11-23 13:10:19.525562	NGN	49819811	closed	\N	2025-11-23 14:10:00	1	\N	2025-11-23 13:11:01.673	cycle_receiver	1	1
dc2da884-64d8-4f7a-967f-add445fae554	new test 007	1000	monthly	completed	3	3	2026-03-01	2025-11-24	2025-11-24 16:31:36.129771	GBP	49819811	closed	\N	2025-11-24 17:31:00	1	2025-11-24 16:35:36.922	2025-11-24 16:34:03.274	cycle_receiver	1	1
0b883bc6-7ed6-497d-beb8-2b582acf3697	Test	500	monthly	active	1	3	2025-11-30	2025-11-23	2025-11-23 13:15:44.628749	GBP	49819811	closed	\N	2025-11-23 14:15:00	1	\N	2025-11-23 13:17:42.898	admin	1	1
898ba600-e79f-42a6-81e3-07c212754ae1	UI Update Test Group	5000	weekly	pending	1	10	2025-11-30	2025-11-23	2025-11-23 17:51:18.097977	NGN	6be8ed1e-b584-4122-970d-557bf80ea1b2	closed	\N	2025-12-13 00:00:00	0	\N	\N	cycle_receiver	1	1
3b5adf7d-75e4-449b-8216-092d9d4317f8	Test	56454	monthly	active	2	3	2025-12-30	2025-11-23	2025-11-23 13:21:16.399787	NGN	49819811	closed	\N	2025-11-23 14:22:00	1	\N	2025-11-23 13:22:28.436	cycle_receiver	1	1
baedd43c-715b-4dd4-92fa-7f7b294c4edd	Collection Date Update Test	10000	weekly	pending	1	10	2025-12-14	2025-12-14T00:00:00.000+00:00	2025-11-23 17:55:43.200321	NGN	ea8fc431-be93-417f-a94a-23b877b5d0f1	closed	\N	2025-12-14 00:00:00	0	\N	\N	cycle_receiver	1	1
10de168e-136a-412a-88b9-2165d5df3a7c	Test	754	weekly	completed	3	3	2025-12-14	2025-11-23	2025-11-23 13:23:52.959776	NGN	49819811	closed	\N	2025-11-23 14:23:00	1	2025-11-23 13:25:49.537	2025-11-23 13:24:54.211	cycle_receiver	1	1
2a2eba54-dfeb-4170-abf8-56b08a453958	Test	755	monthly	active	1	5	2025-11-30	2025-11-23	2025-11-23 13:26:56.221972	NGN	49819811	closed	\N	2025-11-23 14:26:00	1	\N	2025-11-23 13:46:11.046	cycle_receiver	1	1
ace8e656-123e-4aa3-b017-fab2333e6342	Test Adjustment Group	5000	weekly	pending	1	10	2025-11-30	2025-11-23	2025-11-23 14:54:07.238446	NGN	4733e4be-3a1b-466d-850e-96d7a93c35d8	closed	\N	2025-11-30 14:54:00	0	\N	\N	cycle_receiver	1	1
4ae0e524-b5c3-490a-928c-cd9d92c9bd54	Collection Logic Test	5000	weekly	pending	1	10	2025-12-13	2025-12-13T00:00:00.000+00:00	2025-11-23 18:34:05.282608	NGN	6e5d8182-2e7f-4eef-85cf-4f9f9fbd4a3c	closed	\N	2025-11-30 18:34:00	0	\N	\N	cycle_receiver	1	1
91a47d4c-c362-4425-96bb-e68322c24df3	Adjustment Test Group	7500	weekly	pending	1	10	2025-11-30	2025-11-23	2025-11-23 14:59:26.778992	NGN	e2bbe7d6-e425-4928-b4ed-c22cccbacd06	closed	\N	2025-12-07 00:00:00	0	\N	\N	cycle_receiver	1	1
9119b9d9-84b4-4c28-8fdf-c3576f826892	Final Verification Group	15000	monthly	pending	1	10	2025-11-30	2025-11-23	2025-11-23 15:07:43.931442	NGN	cd7e6678-f5f6-486f-a5a9-1439ddb39d70	closed	\N	2025-12-13 00:00:00	0	\N	\N	cycle_receiver	1	1
0eda30f9-e040-453c-a809-f45d8c8e7b38	testing 	10000	monthly	active	1	3	2025-12-23	2025-12-23T00:00:00.000+00:00	2025-11-23 20:44:51.513231	NGN	49819811	closed	\N	2025-11-23 21:44:00	1	\N	2025-11-23 20:49:44.308	cycle_receiver	1	1
623c1a2f-fc12-4a03-a4a8-17561e16cb34	Timeline Immutability Test	5000	weekly	pending	1	10	2025-12-14	2025-11-24	2025-11-24 16:08:03.115108	NGN	1d5a8b7b-6893-4115-80fa-c9b9a42c1c85	closed	\N	2025-12-01 16:07:00	0	\N	\N	cycle_receiver	1	1
728cd1ea-8902-41da-b5b9-2c0c741ad221	Normalization Test	5000	weekly	pending	1	10	2025-12-09	2025-11-24	2025-11-24 16:13:01.14873	NGN	6a56d718-e072-4596-a1d5-21fe8e1be4cc	closed	\N	2025-12-01 16:12:00	0	\N	\N	cycle_receiver	1	1
53c993fb-e8e3-4572-8056-8af9f3874127	Validation Test Group	5000	weekly	pending	1	10	2025-12-08	2025-11-24	2025-11-24 16:18:27.419405	NGN	2e396f00-a002-49f2-8c38-ea419fdfe03a	closed	\N	2025-12-01 16:18:00	0	\N	\N	cycle_receiver	1	1
6024de73-8355-41d0-9a99-070cccc2eb0f	Testing it now	500	monthly	pending	1	3	2025-12-30	2025-11-24	2025-11-24 16:39:36.837025	NGN	49819811	closed	\N	2025-11-24 17:40:00	0	\N	\N	cycle_receiver	1	1
9fde8e31-4ddf-43b8-80b6-acffc5259d27	Test	475575	monthly	active	1	3	2025-11-30	2025-11-23	2025-11-23 12:20:35.327064	GBP	49819811	closed	\N	2025-11-23 13:20:00	1	\N	2025-11-23 13:07:28.472	cycle_receiver	0	1
971d53d8-625c-4c92-b974-2007962de683	ne	500	monthly	completed	5	5	2026-04-27	2025-11-24	2025-11-24 17:19:26.421844	CAD	49819811	closed	\N	2025-11-24 18:19:00	1	2026-01-02 16:47:17.898	2026-01-02 16:45:48.851	cycle_receiver	1	1
30941dec-81b8-4056-b31d-232893170efd	Test	500	monthly	pending	1	3	2026-02-05	2026-01-02	2026-01-02 19:40:42.919728	NGN	49819811	closed	\N	2026-01-05 19:40:42.483	0	\N	\N	admin	1	1
13240fad-b20a-4412-be5e-3fbe1649fd35	Test	500	monthly	pending	1	3	2026-02-05	2026-01-02	2026-01-02 19:53:29.381306	NGN	2c4d4513-10b4-4442-b476-9cbe6055df76	closed	\N	2026-01-05 19:53:29.295	0	\N	\N	admin	1	1
\.


--
-- Data for Name: invite_links; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invite_links (id, group_id, token, created_by, expires_at, max_uses, used_count, created_at) FROM stdin;
b8be8d61-6c57-4d5c-9192-e76e21e2799b	9fde8e31-4ddf-43b8-80b6-acffc5259d27	bf2cc587-0902-4669-a791-6e96fe442c4d	49819811	2025-11-30 12:25:07.25	\N	0	2025-11-23 12:25:07.482652
4c1fa401-c2ae-4f0f-b9c6-36f93102895b	0b883bc6-7ed6-497d-beb8-2b582acf3697	8b8cf2e9-07a2-4b5f-8660-d11b07abc973	49819811	2025-11-30 13:16:38.734	\N	0	2025-11-23 13:16:39.018585
3d7a1646-5668-46e4-a650-e851aca90f93	13240fad-b20a-4412-be5e-3fbe1649fd35	2f6f89d8-2e85-4989-a07e-f76ee5895eeb	2c4d4513-10b4-4442-b476-9cbe6055df76	\N	\N	0	2026-01-02 19:53:44.201226
\.


--
-- Data for Name: join_requests; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.join_requests (id, group_id, user_id, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: members; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.members (id, group_id, name, phone, avatar, join_date, status, rotation_order, user_id, role, can_post_in_group, is_admin) FROM stdin;
07d0f3ae-0755-47ae-a0e4-d611e8dc39fc	0b32fd7f-1b17-458f-8a9c-ad592c8b036e	Afolabi Ajao	+447846779604	\N	2025-11-21	active	1	49819811	creator	1	0
b10427b9-9cec-4dac-8a14-99975caece93	0b32fd7f-1b17-458f-8a9c-ad592c8b036e	vfgjfddhdfh	654446456155614	\N	2025-11-21	active	3	\N	participant	1	0
3a4eec3c-8c70-4109-bedf-98c93a4f1f0d	4ae0e524-b5c3-490a-928c-cd9d92c9bd54	Logic Test User		\N	2025-11-23	active	1	6e5d8182-2e7f-4eef-85cf-4f9f9fbd4a3c	creator	1	0
52bf6836-4770-4fbd-8c84-f71efd2b05a2	0b32fd7f-1b17-458f-8a9c-ad592c8b036e	dsgsdgbss	564448449849848	\N	2025-11-21	active	2	\N	participant	1	0
2aaa9fc8-8fe9-4df9-848f-3305ff6a895f	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	Afolabi Ajao	+447846779604	\N	2025-11-21	active	1	49819811	creator	1	0
c61ead8b-021b-4e47-81d3-576a94b3b8f0	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	jhvhbj	6545415613121	\N	2025-11-21	active	2	\N	participant	1	0
d076abf5-c0fd-45bf-981b-2a2e94a89d09	3c24f1ec-5f93-48bc-91f5-53e7b44eaa53	sesgssdsdhd	64846554668484651546	\N	2025-11-21	active	3	\N	participant	1	0
539ae7ce-e583-47c6-8eaa-2b731c142b38	9fde8e31-4ddf-43b8-80b6-acffc5259d27	Afolabi Ajao	+447846779604	\N	2025-11-23	active	1	49819811	creator	1	0
ab2f9cda-a1be-4d73-8e5f-690a75add5e1	9fde8e31-4ddf-43b8-80b6-acffc5259d27	gfnfgjfgnf	453753853	\N	2025-11-23	active	2	\N	participant	1	0
b2d63668-905b-47b7-b277-19b8198244bf	9fde8e31-4ddf-43b8-80b6-acffc5259d27	uhdfhudghgdh	684456445665645	\N	2025-11-23	active	3	\N	participant	1	0
5c0053bb-d1d8-4d1d-a72e-7afd0a69834c	ace139f5-df59-48a0-ac68-fa5908e91be8	Afolabi Ajao	+447846779604	\N	2025-11-23	active	1	49819811	creator	1	0
4fcf8430-5bec-433a-a48f-0b05a9ca98c7	ace139f5-df59-48a0-ac68-fa5908e91be8	gnfddfj	56786676676776	\N	2025-11-23	active	2	\N	participant	1	0
4109bc28-7127-40ea-9ec6-346aabb4a9ab	ace139f5-df59-48a0-ac68-fa5908e91be8	ddhrdrjuur	75676676788676	\N	2025-11-23	active	3	\N	participant	1	0
85018248-ac0a-4ba5-84a7-9f633ffcd945	0b883bc6-7ed6-497d-beb8-2b582acf3697	Afolabi Ajao	+447846779604	\N	2025-11-23	active	1	49819811	creator	1	0
045979de-0553-4fc3-bfb3-fca7115593e9	0b883bc6-7ed6-497d-beb8-2b582acf3697	gfsfdh	767767867867867	\N	2025-11-23	active	2	\N	participant	1	0
57708c05-b937-4c1d-9a62-5f1c1e1afa87	0b883bc6-7ed6-497d-beb8-2b582acf3697	rehdhhdfh	75677246768676	\N	2025-11-23	active	3	\N	participant	1	0
3e0e41f5-91ff-4c1d-be65-ac858627583a	3b5adf7d-75e4-449b-8216-092d9d4317f8	Afolabi Ajao	+447846779604	\N	2025-11-23	active	1	49819811	creator	1	0
176756aa-6217-45c9-bc63-7f365ddd0988	3b5adf7d-75e4-449b-8216-092d9d4317f8	sdgdssdhd	4567567566	\N	2025-11-23	active	2	\N	participant	1	0
2c56a64b-602b-442b-8d7b-73edc39c4161	3b5adf7d-75e4-449b-8216-092d9d4317f8	dsgggdggdsg	46786678866	\N	2025-11-23	active	3	\N	participant	1	0
3621c49b-7441-498f-a93b-ac60b9c385ad	10de168e-136a-412a-88b9-2165d5df3a7c	Afolabi Ajao	+447846779604	\N	2025-11-23	active	1	49819811	creator	1	0
1576c403-d420-4701-91eb-f7118091d266	10de168e-136a-412a-88b9-2165d5df3a7c	rehfhf	7457767866667	\N	2025-11-23	active	2	\N	participant	1	0
146a771e-d7f3-4ee0-b3c5-bf686a9a8a11	10de168e-136a-412a-88b9-2165d5df3a7c	fjjgdgjjj	56447676767676799966	\N	2025-11-23	active	3	\N	participant	1	0
82a585b4-958d-4a07-baaf-02d3c2d1ffe0	2a2eba54-dfeb-4170-abf8-56b08a453958	Afolabi Ajao	+447846779604	\N	2025-11-23	active	1	49819811	creator	1	0
9f953da7-7a9d-4945-bd7f-e2ee32eb8ef2	2a2eba54-dfeb-4170-abf8-56b08a453958	sdhhfh	547875	\N	2025-11-23	active	2	\N	participant	1	0
1fbad05f-a9ca-4ddb-8655-fed5df7c433e	2a2eba54-dfeb-4170-abf8-56b08a453958	yhnjjf	64846554668484651546	\N	2025-11-23	active	3	\N	participant	1	0
37ab08ae-b301-4786-b933-cf98619d75e0	2a2eba54-dfeb-4170-abf8-56b08a453958	cvncvnvgj	56441451656	\N	2025-11-23	active	4	\N	participant	1	0
5cd22902-4bda-4a31-91ba-113df09d3217	2a2eba54-dfeb-4170-abf8-56b08a453958	thfhhffh	5757678678688	\N	2025-11-23	active	5	\N	participant	1	0
c855ec60-c0eb-4052-bc07-3e8299ebc2a6	ace8e656-123e-4aa3-b017-fab2333e6342	Test Owner		\N	2025-11-23	active	1	4733e4be-3a1b-466d-850e-96d7a93c35d8	creator	1	0
996140be-81bd-48b3-8163-959aeeefb382	91a47d4c-c362-4425-96bb-e68322c24df3	Test Owner 2		\N	2025-11-23	active	1	e2bbe7d6-e425-4928-b4ed-c22cccbacd06	creator	1	0
a0028a78-f813-4e13-bcb9-fe3748c2a0bc	9119b9d9-84b4-4c28-8fdf-c3576f826892	Final Test Owner		\N	2025-11-23	active	1	cd7e6678-f5f6-486f-a5a9-1439ddb39d70	creator	1	0
60f49f33-f80e-4aa8-9bd2-ddefbb317dd6	898ba600-e79f-42a6-81e3-07c212754ae1	UI Test User		\N	2025-11-23	active	1	6be8ed1e-b584-4122-970d-557bf80ea1b2	creator	1	0
8899eea4-e0ff-4e8e-a886-f0243ec7f55f	baedd43c-715b-4dd4-92fa-7f7b294c4edd	Collection Date Fix Test Doe		\N	2025-11-23	active	1	ea8fc431-be93-417f-a94a-23b877b5d0f1	creator	1	0
0fed6a54-bab6-4d0f-8b1e-378c39669543	0eda30f9-e040-453c-a809-f45d8c8e7b38	Afolabi Ajao	+447846779604	\N	2025-11-23	active	1	49819811	creator	1	0
2a0ee7ec-7561-4934-a768-1036ac2b99dd	0eda30f9-e040-453c-a809-f45d8c8e7b38	hjdhjfdhfdh	54541458454545	\N	2025-11-23	active	2	\N	participant	1	0
5fe89da5-4c9b-4fd4-972b-f5ff4df41730	0eda30f9-e040-453c-a809-f45d8c8e7b38	jhdhehgfehfhfeh	55464764244645645	\N	2025-11-23	active	3	\N	participant	1	0
6cf1be8a-336b-4509-94be-56b31416cc6e	623c1a2f-fc12-4a03-a4a8-17561e16cb34	Timeline Test User		\N	2025-11-24	active	1	1d5a8b7b-6893-4115-80fa-c9b9a42c1c85	creator	1	0
2f16d19d-68f5-4d84-a568-724a2bc1444e	728cd1ea-8902-41da-b5b9-2c0c741ad221	Final Check User		\N	2025-11-24	active	1	6a56d718-e072-4596-a1d5-21fe8e1be4cc	creator	1	0
0e27cd47-dcc0-462e-a812-d54afa591360	53c993fb-e8e3-4572-8056-8af9f3874127	Validation Test User		\N	2025-11-24	active	1	2e396f00-a002-49f2-8c38-ea419fdfe03a	creator	1	0
821d0021-4f80-4ffb-b363-f1444bd10042	dc2da884-64d8-4f7a-967f-add445fae554	Afolabi Ajao	+447846779604	\N	2025-11-24	active	1	49819811	creator	1	0
4e0cabd6-26e5-4eae-acb8-c5a1ecf4b2c5	dc2da884-64d8-4f7a-967f-add445fae554	jhvhbj	64846554668484651546	\N	2025-11-24	active	2	\N	participant	1	0
9d91610e-6836-4c20-85c5-0b4efe847ebc	dc2da884-64d8-4f7a-967f-add445fae554	yguygihi	56441451656	\N	2025-11-24	active	3	\N	participant	1	0
0da034e1-90ef-478a-b5a7-6571d7a6c694	6024de73-8355-41d0-9a99-070cccc2eb0f	Afolabi Ajao	+447846779604	\N	2025-11-24	active	1	49819811	creator	1	0
8172b5ca-123c-4e31-be6c-602a291f411c	971d53d8-625c-4c92-b974-2007962de683	Afolabi Ajao	+447846779604	\N	2025-11-24	active	1	49819811	creator	1	0
36d61c3c-df87-47a3-9f7d-5150bc4a07be	971d53d8-625c-4c92-b974-2007962de683	hbjjknjk	561556411544544	\N	2025-11-24	active	2	\N	participant	1	0
b7786de7-d74d-4ca5-b808-643e38401feb	971d53d8-625c-4c92-b974-2007962de683	jnjknjknkk	888488555598888525	\N	2025-11-24	active	3	\N	participant	1	0
10c84889-56b4-4252-a23d-4050c1ebc279	971d53d8-625c-4c92-b974-2007962de683	yuggyhhhjh	955653265656	\N	2025-11-24	active	4	\N	participant	1	0
361058a5-ede7-487a-8108-668fa7aea7d6	971d53d8-625c-4c92-b974-2007962de683	vhhhhhh	4844546655665	\N	2025-11-24	active	5	\N	participant	1	0
abd9b4c5-8d2c-4832-94a2-3efc32ff6ad7	3cad8129-6fa9-41cd-b3b7-56e879760a0f	Test Admin		\N	2025-11-25	active	1	481e91e3-c87a-44b1-b0ab-032a71a9f084	creator	1	0
83cf28bd-9944-4ade-834d-aceb791feb5e	30941dec-81b8-4056-b31d-232893170efd	Afolabi Ajao	+447846779604	\N	2026-01-02	active	1	49819811	creator	1	0
eb8cbe15-3923-48ff-9999-e2b8db64c8f5	13240fad-b20a-4412-be5e-3fbe1649fd35	IT Team		\N	2026-01-02	active	1	2c4d4513-10b4-4442-b476-9cbe6055df76	creator	1	0
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.messages (id, group_id, sender_id, recipient_id, type, content, created_at) FROM stdin;
2567f126-dc14-4e24-b385-9dfdcfac7c1e	\N	901c4804-1f64-4043-9bd0-8929f582fb67	901c4804-1f64-4043-9bd0-8929f582fb67	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-20 20:44:05.563665
93c390d0-5efe-46f3-8c06-ff6990a1e7eb	\N	2fb6ce29-391a-4406-bcd8-318f9f851f1b	2fb6ce29-391a-4406-bcd8-318f9f851f1b	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-20 20:49:01.951134
e0316f75-d405-4121-9630-16704fb0b2bf	\N	d6a29c0b-f5fe-4099-a000-bed66a511018	d6a29c0b-f5fe-4099-a000-bed66a511018	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-20 20:52:16.285287
b51b588a-d92e-49c7-9e10-d52f2b9ba91e	\N	95c20164-d9af-4592-9d9b-cff2a570106d	95c20164-d9af-4592-9d9b-cff2a570106d	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-20 20:55:49.373587
73b9a74a-d1c6-4987-a0d1-ed74cd6f4a9a	\N	38f0636b-add2-422a-8bf7-4cc372cb1800	38f0636b-add2-422a-8bf7-4cc372cb1800	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-20 21:02:15.241265
e6fb05c0-b7b4-42cd-8197-63a735b1e070	0b32fd7f-1b17-458f-8a9c-ad592c8b036e	49819811	\N	group	Hello everyone	2025-11-21 11:19:26.359587
9a08cce1-c283-4002-bcba-11b4352e2c0a	\N	4733e4be-3a1b-466d-850e-96d7a93c35d8	4733e4be-3a1b-466d-850e-96d7a93c35d8	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-23 14:53:21.151068
1e806c20-92ae-46a8-b177-9ca78ffbeef1	\N	e2bbe7d6-e425-4928-b4ed-c22cccbacd06	e2bbe7d6-e425-4928-b4ed-c22cccbacd06	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-23 14:58:46.988959
86fce3a4-ea90-40b7-ad60-01b17053f1d2	\N	cd7e6678-f5f6-486f-a5a9-1439ddb39d70	cd7e6678-f5f6-486f-a5a9-1439ddb39d70	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-23 15:06:10.045605
70ea543f-16d7-4653-a725-b3d7a9bde0cc	\N	6be8ed1e-b584-4122-970d-557bf80ea1b2	6be8ed1e-b584-4122-970d-557bf80ea1b2	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-23 17:50:20.857773
4262f133-6368-4f66-98fd-0b66ddccc9ae	\N	ea8fc431-be93-417f-a94a-23b877b5d0f1	ea8fc431-be93-417f-a94a-23b877b5d0f1	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-23 17:54:53.846585
4ec76cbc-ff0f-4ac7-8909-5feb376d1125	\N	6e5d8182-2e7f-4eef-85cf-4f9f9fbd4a3c	6e5d8182-2e7f-4eef-85cf-4f9f9fbd4a3c	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-23 18:32:45.746362
426cee32-bcfa-4685-972f-7211fa7f936e	\N	1d5a8b7b-6893-4115-80fa-c9b9a42c1c85	1d5a8b7b-6893-4115-80fa-c9b9a42c1c85	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-24 16:06:51.478249
65f52181-50a7-4299-8c67-9a9aab795613	\N	6a56d718-e072-4596-a1d5-21fe8e1be4cc	6a56d718-e072-4596-a1d5-21fe8e1be4cc	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-24 16:12:20.530221
dd3a80a4-5bd4-47fc-9c0d-49037bb43c9e	\N	2e396f00-a002-49f2-8c38-ea419fdfe03a	2e396f00-a002-49f2-8c38-ea419fdfe03a	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-24 16:17:21.614945
d94a38f1-eb6b-4234-9e3b-033ca13b36f3	\N	420eb3f1-baec-4645-ae56-682a5ecbcc34	420eb3f1-baec-4645-ae56-682a5ecbcc34	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 17:52:06.519115
87fcede4-d965-404a-8c55-45ecf67f12a6	\N	7230902e-ef2d-41b0-8090-d085184e6837	7230902e-ef2d-41b0-8090-d085184e6837	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 18:20:32.923149
66c9bc4d-fcf5-46f2-af4f-ec2ba3dce534	\N	0eaa44b7-5f2a-4687-8ad0-8c0a2255252e	0eaa44b7-5f2a-4687-8ad0-8c0a2255252e	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 18:25:38.464483
e960f99d-6981-4610-b615-1f8e48d71ca9	\N	41d35875-60c8-47b7-b744-43c7805e17bb	41d35875-60c8-47b7-b744-43c7805e17bb	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 18:32:40.784494
aec7318b-3397-4e9c-8fe0-76b6475fb3a8	\N	7b1f99a8-fdad-4a6c-87ac-c1cfe07df881	7b1f99a8-fdad-4a6c-87ac-c1cfe07df881	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 18:35:58.690976
1bc9ac06-1aee-4ec3-8563-03e9e50ccf00	\N	8cb116aa-5f49-4cc2-b9c1-e956dafe97cd	8cb116aa-5f49-4cc2-b9c1-e956dafe97cd	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 18:44:04.005201
a894611b-0780-451f-b5c9-c41d3aa413f0	\N	ea4a0548-1762-46bd-96ae-83ff76f19d26	ea4a0548-1762-46bd-96ae-83ff76f19d26	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 18:46:29.490444
9e9b2c74-6fc9-45a8-bf8f-3e5530951ec2	\N	8ce1af50-cbaf-4822-b9ff-0dd364427e7b	8ce1af50-cbaf-4822-b9ff-0dd364427e7b	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 18:53:09.765302
c7a6fb1d-11d8-42f7-9a27-e3cadb139cac	\N	9afe2326-fe00-46cc-aa4b-8732e45c5cc7	9afe2326-fe00-46cc-aa4b-8732e45c5cc7	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 19:00:09.484069
b39f0d07-28e9-4d2b-9b68-479566e308cf	\N	d40f741e-d6ad-4af0-ab7a-dea2c89fa609	d40f741e-d6ad-4af0-ab7a-dea2c89fa609	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 19:12:21.169029
77a60622-459a-4120-8af6-b712ce20dd45	\N	d6a8ab57-b885-4768-9aca-b7c9926c3151	d6a8ab57-b885-4768-9aca-b7c9926c3151	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 19:25:56.617816
1e853820-4cfa-4933-b129-d6375eb9fbab	\N	ef9af297-b4ab-4824-9035-009b73bf7080	ef9af297-b4ab-4824-9035-009b73bf7080	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 19:40:24.039754
7d3a566d-8d18-4dd6-9650-e151ce21aefd	\N	3977bd52-465b-4356-862b-d0a5c3f9b777	3977bd52-465b-4356-862b-d0a5c3f9b777	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 19:42:17.814147
22a29466-89bc-417f-ac7b-5b817b4531fc	\N	481e91e3-c87a-44b1-b0ab-032a71a9f084	481e91e3-c87a-44b1-b0ab-032a71a9f084	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 21:19:10.998892
23bbfe4b-124c-4cc3-ab3b-85763af6a211	\N	450e42f4-df0c-40d6-9eea-21d89b8c0f0e	450e42f4-df0c-40d6-9eea-21d89b8c0f0e	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-26 14:17:07.541535
a521c949-3371-4720-8f83-44f7d8b42977	\N	52c63dc2-01a3-41a8-b632-32cab7a480f3	52c63dc2-01a3-41a8-b632-32cab7a480f3	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-28 13:53:16.000687
15655041-4904-4dba-8184-b8734a3dfe9c	\N	55a302a3-05bb-45dd-a298-c90cd9a00cd8	55a302a3-05bb-45dd-a298-c90cd9a00cd8	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-28 14:51:18.298092
b73a1eb3-eb82-4434-8065-1e3f3fb5c918	\N	2c4d4513-10b4-4442-b476-9cbe6055df76	2c4d4513-10b4-4442-b476-9cbe6055df76	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-12-03 21:21:14.054466
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, user_id, type, channel, title, body, metadata, is_read, sent_at, read_at) FROM stdin;
\.


--
-- Data for Name: partner_clicks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.partner_clicks (id, partner_id, user_id, clicked_at) FROM stdin;
709b8076-ae46-4645-aa5a-ea163b307ba5	c817a560-befd-4ebf-b450-b31a4e77be15	49819811	2025-11-24 20:01:51.688482
f4c87f27-f282-44c9-968a-ebbe0ff6fff7	c817a560-befd-4ebf-b450-b31a4e77be15	49819811	2025-11-24 20:04:48.880041
fec65087-ede0-4b99-a37b-6ebd3faadaf0	ff947655-f90a-457f-8826-b71d1e4f5229	49819811	2025-11-24 20:05:05.168891
\.


--
-- Data for Name: partners; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.partners (id, name, description, category, affiliate_link, commission_rate, logo_url, color, is_active, created_at, updated_at) FROM stdin;
6abdde2a-3e63-4b66-9ddb-c4885571faa4	AlgoAI Gift Cards	Your instant giftcard store	Shopping	https://algoai.com	Competitive commission	\N	from-purple-500 to-pink-500	1	2025-11-24 19:03:21.32136	2025-11-24 19:03:21.32136
c318baea-67f9-428b-aae9-4a632a5ca8ee	Autoport	Auto buying & selling, booking and repair platform	Automotive	https://autoport.com			from-orange-500 to-red-500	1	2025-11-24 19:03:21.32136	2025-11-24 19:28:45.632
c817a560-befd-4ebf-b450-b31a4e77be15	Serenique Luxury Travels	Serenique, your gateway to unbeatable luxury travels	Travel	https://tobitijani.inteletravel.uk	Contact for rates		from-indigo-500 to-purple-500	1	2025-11-24 19:03:21.32136	2025-11-24 21:20:11.696
ff947655-f90a-457f-8826-b71d1e4f5229	Deal	Celebrity Cruises - Black Friday Sale	Travel	https://tobitijani.inteletravel.uk/hotdeals.cfm?id=9880#H9880			from-blue-500 to-cyan-500	1	2025-11-24 20:04:34.369783	2025-11-24 21:20:37.641
\.


--
-- Data for Name: payment_receipts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payment_receipts (id, group_id, member_id, uploaded_by, cycle_number, receipt_url, file_size, uploaded_at) FROM stdin;
\.


--
-- Data for Name: pot_transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pot_transactions (id, pot_id, user_id, amount, currency, type, created_at) FROM stdin;
\.


--
-- Data for Name: savings_pots; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.savings_pots (id, user_id, name, balance_ngn, balance_gbp, balance_usd, balance_eur, created_at) FROM stdin;
7a5cc366-28f4-4bb8-883a-308802cb08c8	49819811	Mortgage	0.00	0.00	0.00	0.00	2025-11-21 17:29:56.188555
0a12c83d-d018-4d73-b5a5-1db3cc728250	49819811	vaaction	0.00	0.00	0.00	0.00	2025-11-28 18:11:13.442722
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
9nFzneMQXN5CpvWMwcIGi3qjtx1Xu2de	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T18:00:11.951Z", "httpOnly": true, "originalMaxAge": 604800000}, "test-mock-oidc.replit.app": {"code_verifier": "LnQtiNSRnIPZyHxB8zqFUv6fCfGQbvyxvJ7Xc56M6FQ"}}	2025-11-26 18:00:12
8jq9DUldc2UWNGQSHLhEFCpUAUkZWIdZ	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T16:03:56.330Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-11-24 16:04:23
_2d9hjxm7S8MpGEHAfkH5_iICmc40rhu	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T18:30:26.491Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763580625, "iat": 1763577025, "iss": "https://test-mock-oidc.replit.app/", "jti": "95a3669eb6f99a3be4691ee26916356e", "sub": "49819811", "email": "afolinks@outlook.com", "auth_time": 1763577025, "last_name": "User", "first_name": "Admin"}, "expires_at": 1763580625, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNTc3MDI1LCJleHAiOjE3NjM1ODA2MjUsInN1YiI6IjQ5ODE5ODExIiwiZW1haWwiOiJhZm9saW5rc0BvdXRsb29rLmNvbSIsImZpcnN0X25hbWUiOiJBZG1pbiIsImxhc3RfbmFtZSI6IlVzZXIifQ.cGM5aRHXKFJ_xjMfpkBTKaHDkFNmE4Cu8xOidAXLpmZ4vbqx5Jub9NMeM9Rp7YfZs20GLcpemHcvWlvFWJfsritle_2rR07lCfjgSUMq49Pz25IJv5uX5xBmw_cI7xc9TTqWbla3uA7r2gK6LHPYcs5FtnHAtUU1677rbGkOUKzcf6d4HJlEpVFnn0ukhRjLDTRPXCTB7lFPjukAXe0-vJNna80evHxdJD7oyor8UNhicKhH4WIp0_awtjyfktemoMKx2wHV1AkqM6KFzkP8igjO3If3TH3trTcTOYw1rSA-zuDboEWvwmFmN2f_vmkD3G5i0uiNEa2AFKout51d-g", "refresh_token": "eyJzdWIiOiI0OTgxOTgxMSIsImVtYWlsIjoiYWZvbGlua3NAb3V0bG9vay5jb20iLCJmaXJzdF9uYW1lIjoiQWRtaW4iLCJsYXN0X25hbWUiOiJVc2VyIn0"}}}	2025-11-26 18:32:19
BLUcfJIX-ywU-kXIIjB7cjZL0-2CnkL8	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T19:42:15.391Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763412134, "iat": 1763408534, "iss": "https://test-mock-oidc.replit.app/", "jti": "5bc177713b28a2f65d3887e2712da959", "sub": "6CRb57", "email": "userV-Z5iB@example.com", "auth_time": 1763408533, "last_name": "Jones", "first_name": "Bob"}, "expires_at": 1763412134, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDA4NTM0LCJleHAiOjE3NjM0MTIxMzQsInN1YiI6IjZDUmI1NyIsImVtYWlsIjoidXNlclYtWjVpQkBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJCb2IiLCJsYXN0X25hbWUiOiJKb25lcyJ9.HjIzH9dJr3dpD4o7_nLUQKnafSZV5Sg0gHI-QcBvqoHz0th636NW-Vfj7N5DQFDlMI0-meyQtEoLNlNbzkd8z3aCgZ-OyqiPe-MXDO0R2DiWUrWOTGDgZRz8ON5R3OX6enAB2J410vI4sW-sJhNpbYbbqqyhFsuOf9bce-x3CvDliV5g3XGJlkJNx-o4X3Gb4f-BkApp1jeAb2Jj1FZX8iXhQQWyzUWC3O3zuf2-i65EyQLmp83kPTG-DHjo9zPE57b5CNwShOhUVFyul1p67B6Hy6HMum9Cxx1hBVhdX1KpCJ9P_t_XyC9n7D6uSoIlpJsXSc5ZFdSdwqw4hORQ6A", "refresh_token": "eyJzdWIiOiI2Q1JiNTciLCJlbWFpbCI6InVzZXJWLVo1aUJAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiQm9iIiwibGFzdF9uYW1lIjoiSm9uZXMifQ"}}}	2025-11-24 19:43:56
XKgAyGVC0h95TS5VzjvuGZEJymq137Yy	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T18:50:41.922Z", "httpOnly": true, "originalMaxAge": 604800000}, "test-mock-oidc.replit.app": {"code_verifier": "HCR8tIxliYfvtN2enO6sMLAMLQotvf4DtxD3UzRk7Fs"}}	2025-11-26 18:50:42
KwnCha3qI_R8nBMcsofPb4McklxVaSRB	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T12:50:15.228Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763646613, "iat": 1763643013, "iss": "https://test-mock-oidc.replit.app/", "jti": "3dfe63aea0b50edaed050547bd93372a", "sub": "9Qpsk5", "email": "creator9Qpsk5@example.com", "auth_time": 1763643013, "last_name": "User", "first_name": "Creator"}, "expires_at": 1763646613, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjQzMDEzLCJleHAiOjE3NjM2NDY2MTMsInN1YiI6IjlRcHNrNSIsImVtYWlsIjoiY3JlYXRvcjlRcHNrNUBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJDcmVhdG9yIiwibGFzdF9uYW1lIjoiVXNlciJ9.mbPiQcJw8WLGdQDXvouVBeaEJBZ7slSp4c4BrElwcvUv1i5t62oxsbH6Rvfc9apLcllRl_XBrVVYUUm3rqM1bwt-yN2isu3cYh7_gWHaA41urnw-dIRwgKCs24JATSzaWcp1KuvQz6-uXCvo8aA2mRmS4ourxhJtuyHbMcq-PY7-LTJNt5AMnxOpbu1eOj5bDWtKDPIYC2HTdFbYsqNTOc5pRZPsiFGGKqa5M-8doiCHss0JO-ItWKmGLkCna3tTGMk_9HbtaG94LOk1_ikH1lmzq1ZCxGWn_8HE7it1RxPwhSYyopy-bBgLAdB3IWH7yHIuMnzmOrX3coCANpRNpg", "refresh_token": "eyJzdWIiOiI5UXBzazUiLCJlbWFpbCI6ImNyZWF0b3I5UXBzazVAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiQ3JlYXRvciIsImxhc3RfbmFtZSI6IlVzZXIifQ"}}}	2025-11-27 12:57:05
BzvzqfowfvaIbFe3-fTc4yHPTUbECcHl	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T21:08:17.219Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763417296, "iat": 1763413696, "iss": "https://test-mock-oidc.replit.app/", "jti": "8781842d46e35aec7902d27a37d7f2cf", "sub": "i8dtct", "email": "creatorf5thxw@example.com", "auth_time": 1763413696, "last_name": "Creator", "first_name": "Test"}, "expires_at": 1763417296, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDEzNjk2LCJleHAiOjE3NjM0MTcyOTYsInN1YiI6Imk4ZHRjdCIsImVtYWlsIjoiY3JlYXRvcmY1dGh4d0BleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJUZXN0IiwibGFzdF9uYW1lIjoiQ3JlYXRvciJ9.fVcAQ5SLElw4FugUMXgJ0bEFO31R0AISxQZF101ScGq25W_ukD37CdjV4JHTeapafxRpNtfnAwW7nJ_GjsvZHCbMNFg2AB-ABNs082AyCjZdHe-Kg5Lskbdh_PmPvfkEMP9aNtr4gzDbN8-8bZekkN99o1el_jQsY2JdU-ScrGw_btCsmIgHV0_Tn6VgqsK5go0VIbCal3Klr_bkebJAuveQ6dDF7mVH2TPRyZTgZFllcOD-BfFS2dnPYRuQd73FSr6GEb8RZsF8pxolJq1__0E2nCUoa9e5YuM-nXGRGSVpjhKHDtrQAHf_IZPhFfCh5xOl0_RrsAWeJee7V_xvnQ", "refresh_token": "eyJzdWIiOiJpOGR0Y3QiLCJlbWFpbCI6ImNyZWF0b3JmNXRoeHdAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiVGVzdCIsImxhc3RfbmFtZSI6IkNyZWF0b3IifQ"}}}	2025-11-24 21:12:10
EwUgdKJ2dbTjucK1uM9-cTloqIdmu-pD	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T21:02:58.850Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763416977, "iat": 1763413377, "iss": "https://test-mock-oidc.replit.app/", "jti": "867fde65994a1c28752ccc7a54c82051", "sub": "NDJdq7", "email": "creatorwa2O9s@example.com", "auth_time": 1763413377, "last_name": "Creator", "first_name": "Test"}, "expires_at": 1763416977, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDEzMzc3LCJleHAiOjE3NjM0MTY5NzcsInN1YiI6Ik5ESmRxNyIsImVtYWlsIjoiY3JlYXRvcndhMk85c0BleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJUZXN0IiwibGFzdF9uYW1lIjoiQ3JlYXRvciJ9.W_Awch1WiSirCo_ioF1I_G47YdSfyIqK-ZjiHPKxE5xoeCLYDx2JSlLuUI8vx7lnMc35wAZ_GePsydcoQMliaCzswLH-6PVIy7RBFiPV0XPXbsufzANyDkXJjlmrW0JLjGlX4eEShQ2BsBavFkl6ZpJ_5jwyKUv4VIKZeJeflB_dz9JLaBHJJOIHFHryK4TQa0cCLzirPrN24MPfJLt46D87bwr-MjoFvzv2ccPsy5zBWM9SBtgG6uAKhAjR0j9vaOw6V-gUrZjfLGAq4IiTIE51sauXuwZw9dBXMMeXez6eQsPAlS3otYIAJNCmy-LouckIe0t-9v_ZssWntX1OSQ", "refresh_token": "eyJzdWIiOiJOREpkcTciLCJlbWFpbCI6ImNyZWF0b3J3YTJPOXNAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiVGVzdCIsImxhc3RfbmFtZSI6IkNyZWF0b3IifQ"}}}	2025-11-24 21:06:15
v3LRl7j_KuSyjUFighkBVpoLWJDOOX-B	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T14:04:07.994Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-11-27 14:04:08
IIr59tjTBTDe0-D34Ic2m5lLny0bL-Uc	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T19:31:25.198Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763411484, "iat": 1763407884, "iss": "https://test-mock-oidc.replit.app/", "jti": "f8c34472b6c8e772ba160ab32a4e45ed", "sub": "7wfbL4", "email": "user7wfbL4@example.com", "auth_time": 1763407884, "last_name": "Jones", "first_name": "Bob"}, "expires_at": 1763411484, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDA3ODg0LCJleHAiOjE3NjM0MTE0ODQsInN1YiI6Ijd3ZmJMNCIsImVtYWlsIjoidXNlcjd3ZmJMNEBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJCb2IiLCJsYXN0X25hbWUiOiJKb25lcyJ9.o5kSsSHTj_3jKXiDR1gXhnIFGoVsLg123H7_-qiSDmYka30g0FHKj2w3ZNcXuOSFhjTjitSuCDOTVHFE-jhC3aFU7QxwR0aDGl0r79mXuqysLd2NNJfaLZsgjnpHvTm0UtDgwYC0NcdXqQMYrToVRI2VM8agIW9Kf4ZEZgEn0wpFdd9t0CLq9M6S3jULWYQNVh-M35PVevSbX_VjVnD0Nh4cINZ5hb6-NogCxvN__1Ml6YmHudfX5sTg4TXM4Bcz4pfZqNIRQSJp_DK4EWrc1TU0imAAsYFf-ab-qRN6CbKCfkpwt_uDY4--HkJY4maVPcRd9BMI-w6o5pb2ATo3vg", "refresh_token": "eyJzdWIiOiI3d2ZiTDQiLCJlbWFpbCI6InVzZXI3d2ZiTDRAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiQm9iIiwibGFzdF9uYW1lIjoiSm9uZXMifQ"}}}	2025-11-24 19:31:38
Wq4Lsp-FNIHtpGzcgZ0nKHKDQAHLvpwb	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T16:11:46.614Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-11-24 16:12:15
2RC-N8xucdZ-obbUtFYRmaV7PUh4Aoff	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T14:04:08.579Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-11-27 14:04:09
test-session-1764093793305	{"cookie": {"path": "/", "expires": null, "httpOnly": true, "sameSite": "lax", "originalMaxAge": null}, "test-mock-oidc.replit.app": {"user": {"sub": "420eb3f1-baec-4645-ae56-682a5ecbcc34", "email": "testuser-ed_jok@example.com", "last_name": "User", "first_name": "Test"}}}	2025-11-26 18:03:13.305
Bz21PfOQ_sqbu_nJiWJANNSnt-5J8c2H	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T14:04:09.074Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-11-27 14:04:10
Gp9ykEtQRrtvkPtbT7iP5hvH5L4eiaR_	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T19:48:22.863Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763412502, "iat": 1763408902, "iss": "https://test-mock-oidc.replit.app/", "jti": "3c48bf709d6bbd4ba93077239566c805", "sub": "UutuED", "email": "userq6RIGH@example.com", "auth_time": 1763408902, "last_name": "Jones", "first_name": "Bob"}, "expires_at": 1763412502, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDA4OTAyLCJleHAiOjE3NjM0MTI1MDIsInN1YiI6IlV1dHVFRCIsImVtYWlsIjoidXNlcnE2UklHSEBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJCb2IiLCJsYXN0X25hbWUiOiJKb25lcyJ9.A-3-tnqNNXO_9eaKs10ioaqOPyJazFx7vt-80KAlzaevScuX40zaMIBGxv2NETZ5-tG1X572nH0ya7nLlUvGzAxjelvx-kdNXp3EzcCM0GoGUfHP3rwisZW6FE-009NFXcGozwETa6qmOCOZLiijRqNqwCRLCZTFhxMdd5x3kkNGykCj3EczKGDDEX8TGVpbadxSW15LZeV4St5xSkcw8m0x-UXxcYjgdhPoysyNuPaznbSgv-b7UPpIrUbGjGzFT-YQiAonKKpqNxS8aATjw90fOetf-SzQswU8C-IWwZUhMXdLzG84REF8_5N9ORHeWNxuHQbK5c5nqLftmuQXjw", "refresh_token": "eyJzdWIiOiJVdXR1RUQiLCJlbWFpbCI6InVzZXJxNlJJR0hAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiQm9iIiwibGFzdF9uYW1lIjoiSm9uZXMifQ"}}}	2025-11-24 19:48:36
uLc5QjUV1FpVj6V3xOL9yVxnphwbBQRC	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T16:14:48.794Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-11-24 16:15:03
OooROYTaQU2X1h7Eu6ME7Nr9U1Ie04s5	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T19:37:20.336Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763411838, "iat": 1763408238, "iss": "https://test-mock-oidc.replit.app/", "jti": "de023e58b9d9d587ef1e36dbed4a432d", "sub": "9J07Uk", "email": "user9J07Uk@example.com", "auth_time": 1763408238, "last_name": "Jones", "first_name": "Bob"}, "expires_at": 1763411838, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDA4MjM4LCJleHAiOjE3NjM0MTE4MzgsInN1YiI6IjlKMDdVayIsImVtYWlsIjoidXNlcjlKMDdVa0BleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJCb2IiLCJsYXN0X25hbWUiOiJKb25lcyJ9.dpoUdE0ZVEzo1U28Uy7nrVHn-He_LzlXC2GMDHoRsDPp3w76vAAnvEzAS-grVGpYSDsnEv8OI3VfCnGu5f9YCVDiBMcaV2xQfVwsgjjITLPxFqSNirsFS-Rnry83OtJ-Cah7lUyGIb9tyWZOgEsgqKrP4LtBaTUA4cz2P4ggo-WWTR97mYeK5z8OCDBmDiMynAUUF5sCoX7GndSKJ4E816l9rPyLH2AvNNbeVGz9FDOrNSPWEJ2OlR7IhCI6aJwzcOdT-EbGTQOLZmQJr3tFVUeZxclb2UDPQzzMlcS1vsHNmieaTzuJSkafMImnW2vpHKQ6rLaqP3S_UU3B9JIRLg", "refresh_token": "eyJzdWIiOiI5SjA3VWsiLCJlbWFpbCI6InVzZXI5SjA3VWtAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiQm9iIiwibGFzdF9uYW1lIjoiSm9uZXMifQ"}}}	2025-11-24 19:38:48
WXoxYzdXKqhgPmd1YLu5Xt3z7hbkfhZ5	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-25T14:27:19.499Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763479638, "iat": 1763476038, "iss": "https://test-mock-oidc.replit.app/", "jti": "abd80364ee53bf489e8b0be91206b1c1", "sub": "4Rj-4q", "email": "4Rj-4q@example.com", "auth_time": 1763476038, "last_name": "Doe", "first_name": "John"}, "expires_at": 1763479638, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDc2MDM4LCJleHAiOjE3NjM0Nzk2MzgsInN1YiI6IjRSai00cSIsImVtYWlsIjoiNFJqLTRxQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IkpvaG4iLCJsYXN0X25hbWUiOiJEb2UifQ.Z7hK6tJt1eS0NTut_YNY2I22xsl6kvF0Utj-vyM59QYU5xB0VomYeC1NYM44zHwYYJM7nKLuMiInI_w3r-fnveub1a4tIKbo7KbHivyb0OcjL30fFL7NAp-I-BVkAt4f0UfFftcqAr_QIXK72Yg46bNBHccKmiTUO-cRmedQDxCMdeB1m2ZljDyECfNbZDkUUpCI-ktBnd4sUomi5y7Ksrkb1gzYnxGKUcXyAYQm_WxRlBdVXXaiIr6lk0Ze3_BiRjH2KgVuNx4X-CqBWM1hQhaXq5CwntB-rUTnbJAvCn6L_aMERi3iir9gPqop8NWsr_-sHkttv4GX_NX2Oa8O8g", "refresh_token": "eyJzdWIiOiI0UmotNHEiLCJlbWFpbCI6IjRSai00cUBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJKb2huIiwibGFzdF9uYW1lIjoiRG9lIn0"}}}	2025-11-25 14:29:31
TbDUivduxdmTk_iN7jBoJSh5tE5eBLau	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T15:19:44.307Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763569183, "iat": 1763565583, "iss": "https://replit.com/oidc", "sub": "49819811", "email": "afolinks@outlook.com", "at_hash": "eSvKBed64B2xdUMFonPjUg", "username": "afolinks", "auth_time": 1763420251, "last_name": null, "first_name": null}, "expires_at": 1763569183, "access_token": "vksi-9fb-y7kUwXNAyEL-1zcDEwclss0iCtdGSf7lYy", "refresh_token": "1JIlLhAMjU_JM0RPB0rmS21PVPqXAOseEx35mC8q3A-"}}}	2025-11-26 15:32:20
M7_15Fh5kw9CxI1yEYZIBFn9LwcFzH1g	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T20:58:10.518Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763589490, "iat": 1763585890, "iss": "https://test-mock-oidc.replit.app/", "jti": "dd3a6821d4305d9f5c852a170cf2bb24", "sub": "49819811", "email": "afolinks@outlook.com", "auth_time": 1763585889, "last_name": "Links", "first_name": "Afo"}, "expires_at": 1763589490, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNTg1ODkwLCJleHAiOjE3NjM1ODk0OTAsInN1YiI6IjQ5ODE5ODExIiwiZW1haWwiOiJhZm9saW5rc0BvdXRsb29rLmNvbSIsImZpcnN0X25hbWUiOiJBZm8iLCJsYXN0X25hbWUiOiJMaW5rcyJ9.DCsTh4rWOnvKhgZbelR5a4YwAgVZF-vsJ2prn0oc3G4AH3wRDCYdwIYs4KuLyT9xrV6-omLbKvavCUN5GbF4cUtJhuLRMwf7OSoXk80LV74tJnsxVpAlfkopRfWyJ58XXLLwVwkiywjvsePs4lqHQ878hPwl6vO9RPFDa-DiAvsevvW7psXns8sR2UZKDp8zVo9hZWxdsAtT7XB0VrxgLTTBoPMKxF0Ln8Zwcgz-Eo54yOJAccJXEregw1y-9PuTOq0YZjjjDD2lcEB8MlP9QQl43be3Ky9oB077Rq9wf-vOSWpbkPVYjVxpCHv3u2wGYpcI12eTJWw1I4KidQdL5A", "refresh_token": "eyJzdWIiOiI0OTgxOTgxMSIsImVtYWlsIjoiYWZvbGlua3NAb3V0bG9vay5jb20iLCJmaXJzdF9uYW1lIjoiQWZvIiwibGFzdF9uYW1lIjoiTGlua3MifQ"}}}	2025-11-26 21:02:18
lqmN3xeu1aM1oHT39avwZDbtgbhG_tOj	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-28T13:01:08.090Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763733666, "iat": 1763730066, "iss": "https://replit.com/oidc", "sub": "49869831", "email": "t.girl4rill@yahoo.com", "at_hash": "ao2NFTIqTMt-Fyw1X0BuGg", "username": "tgirl4rill", "auth_time": 1763730065, "last_name": null, "first_name": null}, "expires_at": 1763733666, "access_token": "ny3nPBPJTgkD_1yMWs1DS_wLL9VGH70KwMwjbnhuAsV", "refresh_token": "BebkYkYu7QHe9OzbRKqSwy13s9Tx1Xl5ujNgyXf7KSE"}}}	2025-11-28 16:04:10
IN6xHPsp2A4XyqoJ83zKKS6TbQTdcu-Y	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T17:19:42.836Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763576381, "iat": 1763572781, "iss": "https://replit.com/oidc", "sub": "49819811", "email": "afolinks@outlook.com", "at_hash": "1q_wLO26dIRSH_5T5VyFyw", "username": "afolinks", "auth_time": 1763397612, "last_name": null, "first_name": null}, "expires_at": 1763576381, "access_token": "nc8nA1KgiGttthn-GHPZfBtUCsqU-orM-bXMwWl0Jwk", "refresh_token": "cA0D86tlHZWPWZOMN15Lmuu-1Gmi-xY7kxAl00h_1iQ"}}}	2025-11-26 17:34:19
hL7tiBL_uAWlDqhMhZG_ZzrQ1r_TyXI2	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T21:11:50.050Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763417508, "iat": 1763413908, "iss": "https://test-mock-oidc.replit.app/", "jti": "74fda2daf77d6e6f1cb3481f3f3cbaf4", "sub": "sjT0AR", "email": "memberF7cFSg@example.com", "auth_time": 1763413908, "last_name": "Member", "first_name": "Test"}, "expires_at": 1763417508, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDEzOTA4LCJleHAiOjE3NjM0MTc1MDgsInN1YiI6InNqVDBBUiIsImVtYWlsIjoibWVtYmVyRjdjRlNnQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IlRlc3QiLCJsYXN0X25hbWUiOiJNZW1iZXIifQ.AipV7_NkdYv8u0-vUfaPWuJBC9MBf63csgftULO2fbQZPu86fWIUNLAzDcadFekAWCIBLGWzMtBus4S74QDPI_L_ziO5L3i4VnEgESuzN_N-16WnUC_25H3SIcbefMjmp56w0N-13c9js0Lx84GzloXpM_8sgLjjp7gUCXPsDp20j-Zou1Y4VJfbCh_W1nCK7kejdBLrmX6NH9JVQxdS57V-nDWI3SXsfmhIWDO3wHpTkVWu4SzYzNSlNDp7NBoZL7PEm4mOeKzcDrOBpojjDdoAM35s6fJOc05WP0UTlasyznfqMPFv2ybj0NihV74Qum8OcXsAALgZIMPTioV_Qg", "refresh_token": "eyJzdWIiOiJzalQwQVIiLCJlbWFpbCI6Im1lbWJlckY3Y0ZTZ0BleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJUZXN0IiwibGFzdF9uYW1lIjoiTWVtYmVyIn0"}}}	2025-11-24 21:12:16
UPtpNA6Pp7K1Dls4X9UNNnBBQZTKNQRO	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T21:13:38.389Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763417617, "iat": 1763414017, "iss": "https://test-mock-oidc.replit.app/", "jti": "7b45e55f579548aa5144f8a29337f6d8", "sub": "hLHE1_", "email": "creatortgCg38@example.com", "auth_time": 1763414016, "last_name": "Creator", "first_name": "Test"}, "expires_at": 1763417617, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDE0MDE3LCJleHAiOjE3NjM0MTc2MTcsInN1YiI6ImhMSEUxXyIsImVtYWlsIjoiY3JlYXRvcnRnQ2czOEBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJUZXN0IiwibGFzdF9uYW1lIjoiQ3JlYXRvciJ9.og6sh7ubmBDyr6LgIa-5v2q8l_XTfMCAUN1RH09PzZuBs65ucFmvfy5rwMRS3sNXJ81TBY6rlrq03YfQ3BK86wZd6PDbJl8UFFkO0zGcx3Y8s-4UZMfPKqNSxllXrwoXWPhYazaj012qtLJ3moeCUxWWxhv4k8uAC_rgQYPlqpV-LAn4e-nqK1N8yW0BZnWt1YHHfaysVl0UB3DCGqPO3WJZY38aqGfLxnSy2VasoDl51YAFbMOY-9GZgxjlTY5nXcTipxv6vAJ4f9eQxZAHVMN2_zumKD5R4-TzgDVYgdE3Q2nGVI8U5aax0zEF0-jOz5w8y6SkGKVN2eJGX7EKtw", "refresh_token": "eyJzdWIiOiJoTEhFMV8iLCJlbWFpbCI6ImNyZWF0b3J0Z0NnMzhAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiVGVzdCIsImxhc3RfbmFtZSI6IkNyZWF0b3IifQ"}}}	2025-11-24 21:17:23
03I-FgbiyxFvCYNI6A80x9k8lhs6aBBb	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T14:04:09.427Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-11-27 14:04:10
J6gVk_Kc1aGXJJunsNQFSVFbeuPr08ee	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T17:38:08.596Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "3a_eOkouOukwxuOA15Yx1kLY3n0ZYadDNzoTLE62JtY"}}	2025-11-26 17:38:09
NkhnatVWXLyQ3_EGACPF9bMVs0UIlEsu	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T20:41:18.964Z", "httpOnly": true, "originalMaxAge": 604800000}, "test-mock-oidc.replit.app": {"code_verifier": "JwpBEH-1yPImeW9HbodZ90gqWtBoUGojo-Xmm_X26VE"}}	2025-11-26 20:41:19
-XRNehyD_i93GabXHidzHaRt-bEfM9Q_	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T18:07:29.971Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763406448, "iat": 1763402848, "iss": "https://test-mock-oidc.replit.app/", "jti": "7878545b1291ca09acd31a0fec68d24d", "sub": "YAG4vJ", "email": "YAG4vJ@example.com", "phone": "+1234567890", "auth_time": 1763402848, "last_name": "TestLastName", "first_name": "TestFirstName"}, "expires_at": 1763406448, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDAyODQ4LCJleHAiOjE3NjM0MDY0NDgsInN1YiI6IllBRzR2SiIsImVtYWlsIjoiWUFHNHZKQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IlRlc3RGaXJzdE5hbWUiLCJsYXN0X25hbWUiOiJUZXN0TGFzdE5hbWUiLCJwaG9uZSI6IisxMjM0NTY3ODkwIn0.CKtRglu-ff_KO1-SB4s4REWZVdCx1aVJQCb2RP0vmOmIedFQa3HUaQd8VV4RaquoymbQv2y79VMj-qGj_QRh5vepjwADVsB9Tj0WHZLHQ9dCgRan9DSTgIzeJw2iJGxo2qXH4LwusZgf150w5DIaJNBoU0koqbXDbLKJQfcx6DQnsQ6LwPH42SqW2QJlYLIfUy73gtuPVJJw9TSMPqYgKQutu1hZXC-9_Fk9bs7WghZ1-Aqy3zidB0v7jHFzfDp5NuG-R7aYFhXpdtVQhyVoommYqV_JDoOQhrkzF5uz5uGktSk354AEoi1h41GFRtJjh5-kqjgOyN2u8l3gH-WE9A", "refresh_token": "eyJzdWIiOiJZQUc0dkoiLCJlbWFpbCI6IllBRzR2SkBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJUZXN0Rmlyc3ROYW1lIiwibGFzdF9uYW1lIjoiVGVzdExhc3ROYW1lIiwicGhvbmUiOiIrMTIzNDU2Nzg5MCJ9"}}}	2025-11-24 18:08:34
uDTgVKigqNPJSMaspPASWZEq34qBaHzL	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-25T15:59:58.106Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763485197, "iat": 1763481597, "iss": "https://test-mock-oidc.replit.app/", "jti": "4f9bb3136cfbbbd701768d57da9324c1", "sub": "test-complete-${nanoid(6)}", "email": "testUz_taX@example.com", "auth_time": 1763481597, "last_name": "User", "first_name": "Test"}, "expires_at": 1763485197, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDgxNTk3LCJleHAiOjE3NjM0ODUxOTcsInN1YiI6InRlc3QtY29tcGxldGUtJHtuYW5vaWQoNil9IiwiZW1haWwiOiJ0ZXN0VXpfdGFYQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IlRlc3QiLCJsYXN0X25hbWUiOiJVc2VyIn0.K7Q_mfCTsB-gTEKDsC1d3H7bZe4Ojhz-qIMcJXGk7wbLfvzYbDMqFjO-JIsEQpEEp5lCF5o9B-0JC0_hgYRrmkWeGl6lm2N33x9a8CCgpXZKpGqafowbFLTGzsBeCLCLrdGVtauAJBCSJ3DzRjnGnHVtfP49T-umHt7fCigsXmtNuI6IyncgNZ8WqWgzjkQEk4SN4fclNbVkCfipZntS3K4Sm-EbCJLCmcup_7KCKvLb0xXcsuWZNacC2uaFYFcO4hp2j8_7c9rOOobBlmh5qVXNW0R1pa_QecL4tpp0DgrFERUtrhSHAd7e6w6uT957PU77--byapHuik09N58GZw", "refresh_token": "eyJzdWIiOiJ0ZXN0LWNvbXBsZXRlLSR7bmFub2lkKDYpfSIsImVtYWlsIjoidGVzdFV6X3RhWEBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJUZXN0IiwibGFzdF9uYW1lIjoiVXNlciJ9"}}}	2025-11-25 16:01:54
42yzv1d5Jj0o6rcPTVrH4y1bTdtWPIh9	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-25T16:08:35.303Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763485714, "iat": 1763482114, "iss": "https://test-mock-oidc.replit.app/", "jti": "173524854f59c6575c91bf6c49a50ed7", "sub": "final-solo-${nanoid(6)}", "email": "finalp16TcE@example.com", "auth_time": 1763482114, "last_name": "Solo", "first_name": "Final"}, "expires_at": 1763485714, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDgyMTE0LCJleHAiOjE3NjM0ODU3MTQsInN1YiI6ImZpbmFsLXNvbG8tJHtuYW5vaWQoNil9IiwiZW1haWwiOiJmaW5hbHAxNlRjRUBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJGaW5hbCIsImxhc3RfbmFtZSI6IlNvbG8ifQ.yXX3G2i4HnYjFySerjeeDJyaF6y098Yt6WdhHtG_IoT4RU70Qo6l-yHVoh_rjqfzCDGhxH4hhHz9wnNNoj5Sq5-NfjvQa7sSFy3nVeKWIshJIeTInBRS57SEcIhKZxPgKU47XBy2sm9mMrdYRVzR20R5tII9JuVKKeWBOM9rvcXjQVHcjgD78wSqe93aXU56W7KqdCPrRl5QGrP8t95Hubv3E9tTG50F8oRmjrHE8JgxCKZX-UUI8wUxFsvc_A2Qcw_JqJjkIwCnhDeeRR4FtD0uA9bKIPMEERHnSDI6nhhgrj3oGvvmZ0tLRJ0xRQDwjbW4lAe4K-PhoBwHOnGAHA", "refresh_token": "eyJzdWIiOiJmaW5hbC1zb2xvLSR7bmFub2lkKDYpfSIsImVtYWlsIjoiZmluYWxwMTZUY0VAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiRmluYWwiLCJsYXN0X25hbWUiOiJTb2xvIn0"}}}	2025-11-25 16:11:06
FxheO1AqYsA9gSYxv8O1KVf_RY8Fsku1	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-25T14:41:12.417Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763480471, "iat": 1763476871, "iss": "https://test-mock-oidc.replit.app/", "jti": "adc25e7cedaf1ea11a79d6a0a7d1924f", "sub": "final-test-${nanoid(6)}", "email": "finalyWczTW@example.com", "auth_time": 1763476870, "last_name": "Tester", "first_name": "Final"}, "expires_at": 1763480471, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDc2ODcxLCJleHAiOjE3NjM0ODA0NzEsInN1YiI6ImZpbmFsLXRlc3QtJHtuYW5vaWQoNil9IiwiZW1haWwiOiJmaW5hbHlXY3pUV0BleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJGaW5hbCIsImxhc3RfbmFtZSI6IlRlc3RlciJ9.K3-jA5rTJkfm1LxD7Fgri6VHsohSw3Ngf3BQxarb3fXm_c80vUN0Kr-jSvMUJMVEaa243auRPpWtSjptbzheUrmHWHG_5JPwItZ0ihHYX8nE5XRIjRnWiObb0I9xmfrTNY2-T9oe1reEPwYrCCDCG3-CHZeOnnVxSPvTycp63vLMEr2zHU83Lj5d-X0xXM8AXZ-yyGwir6rCr6K5VDwzoCeLalQUdPgP96Tx2xkpgXPe3D2_TUFQuO0begbY2HRnVpU5sNxBZs7EEG47e-AgFungJicDiebfNKdLs5I0q2Amu5TBAtV1H_FPEcCuc_WyrgUen4wz7BESP_L4HPnxbA", "refresh_token": "eyJzdWIiOiJmaW5hbC10ZXN0LSR7bmFub2lkKDYpfSIsImVtYWlsIjoiZmluYWx5V2N6VFdAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiRmluYWwiLCJsYXN0X25hbWUiOiJUZXN0ZXIifQ"}}}	2025-11-25 14:44:09
IbDvAbLxcMlQIyaydPAiI1bDlrDuq5wG	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T16:36:31.047Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763400990, "iat": 1763397390, "iss": "https://test-mock-oidc.replit.app/", "jti": "160350ebe0d5e25dac98625f8c6f44b7", "sub": "iBjHfd", "email": "testuser23xskTh@example.com", "auth_time": 1763397389, "last_name": "User", "first_name": "Second"}, "expires_at": 1763400990, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzMzk3MzkwLCJleHAiOjE3NjM0MDA5OTAsInN1YiI6ImlCakhmZCIsImVtYWlsIjoidGVzdHVzZXIyM3hza1RoQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IlNlY29uZCIsImxhc3RfbmFtZSI6IlVzZXIifQ.FJhKIUqhGNSfKbccZguFDm7A3JMTqg96A8RNKyU28aYs1fraUKXYTR5Bzc0CYFOHrvTvXVdMbHNlrNNRuUJRM2rhI5UyRLjjI9YF8jFgrrrZd9B5eGgCqLwizS6wcFRE1QnWkgMHWMMX7KoztgP7tSfw21DaQpYpper-cGvL--rKNQ3B-qhlSlupGpqaNOsnp3amL6I4cGuibkcJX2XqmiFL9n8lINw_hWxUD236q33vartYDTto974Xl5GxhMMFDWvMqdRXXWcztxbmWl6CHbfVxuAi9vFNZhl2btROELsCxo0kJCEaWR4CxurhvC5frhMFyJbeolWoMQUwTyWZSA", "refresh_token": "eyJzdWIiOiJpQmpIZmQiLCJlbWFpbCI6InRlc3R1c2VyMjN4c2tUaEBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJTZWNvbmQiLCJsYXN0X25hbWUiOiJVc2VyIn0"}}}	2025-11-24 16:37:02
xl54hop2xWha2QUlrTWiz8kiTqaKEFXk	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T19:25:51.230Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763411149, "iat": 1763407549, "iss": "https://test-mock-oidc.replit.app/", "jti": "58291d3f294872bd23583d1fdf31a8a7", "sub": "2wMJah", "email": "user2wMJah@example.com", "auth_time": 1763407549, "last_name": "Jones", "first_name": "Bob"}, "expires_at": 1763411149, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDA3NTQ5LCJleHAiOjE3NjM0MTExNDksInN1YiI6IjJ3TUphaCIsImVtYWlsIjoidXNlcjJ3TUphaEBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJCb2IiLCJsYXN0X25hbWUiOiJKb25lcyJ9.d55gNtBkNkKDUPmC43pt2CtzaeY1Jx9-IOSvgZLSN1Dua8c8Y3gXumcGxZ5GfY0ut66lqk1anRS_Dn6JBy7JbS9AFmuhZN6epkQCu5Fj6EjDrzjDrgU8i_SnMohURj3NzZGVros3ASXaOfayPlIBulqDlr7576QuKgrWins1ucdcBfjm7Il_OMXTLynEGNAJOw0AvghmRlDXNLbouc9ZJARXRHOzAAlLcz8xXlOk-Q6OeZv2GNcWCu8j2yfv0ttSSpIH5GCeoMNSyObAf2PLFHc-1yN6vnOrZE5nwcCBNGeqWdbUaWv-_VIQSqd7s9SboXnDZo-IEy9-EeB-TrLkAA", "refresh_token": "eyJzdWIiOiIyd01KYWgiLCJlbWFpbCI6InVzZXIyd01KYWhAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiQm9iIiwibGFzdF9uYW1lIjoiSm9uZXMifQ"}}}	2025-11-24 19:26:28
SG2VgDLeT1W2tya2QXEjSIn-fSGAkkCq	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T18:02:28.174Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763578947, "iat": 1763575347, "iss": "https://test-mock-oidc.replit.app/", "jti": "5a98790f2e7166c65a7dcfb821eae351", "sub": "regular-user-123", "email": "regular@example.com", "auth_time": 1763575347, "last_name": "User", "first_name": "Regular"}, "expires_at": 1763578947, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNTc1MzQ3LCJleHAiOjE3NjM1Nzg5NDcsInN1YiI6InJlZ3VsYXItdXNlci0xMjMiLCJlbWFpbCI6InJlZ3VsYXJAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiUmVndWxhciIsImxhc3RfbmFtZSI6IlVzZXIifQ.fKefZxa0-kCrAbLam7xSyDp5i0pifaxo2FQRJvb0hvYesyCnOXjQzc2Zpyo7v2ppN_urTtpIjqeZRhsd8WpIaYeGzeRtZ7EHitKrKAuzv-8k_AfBbzWN3qA_H1aC-9jE9zGtmyZGzxCZLFiqkyZtiPeiEUIVFOex2Q3cj0WwyKzIYZ2xzLslU4dDM63AfWGHz7y3gfpUJkiyYThviTwOmmEoO4EfxzpHbl2ICyzXlE_SOYLUEGkbb3q8IOCb_VHWNf9BxC_DojE7k5uUBBSCAXrp3GtrgWXikzbQQsB7CjUmpqzgGLVAz2wgWPsDnC-RveizwXl7O1ZG7iYmk-TJQQ", "refresh_token": "eyJzdWIiOiJyZWd1bGFyLXVzZXItMTIzIiwiZW1haWwiOiJyZWd1bGFyQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IlJlZ3VsYXIiLCJsYXN0X25hbWUiOiJVc2VyIn0"}}}	2025-11-26 18:02:53
cHyueG7FA68AnBsHZQ0YMuw3W8yeKgW8	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-25T14:32:25.817Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763479945, "iat": 1763476345, "iss": "https://test-mock-oidc.replit.app/", "jti": "b1051737f66b68fd6f5e3ca461c2c8bc", "sub": "test-user-completed", "email": "testcompleted@example.com", "auth_time": 1763476345, "last_name": "Completed", "first_name": "Test"}, "expires_at": 1763479945, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDc2MzQ1LCJleHAiOjE3NjM0Nzk5NDUsInN1YiI6InRlc3QtdXNlci1jb21wbGV0ZWQiLCJlbWFpbCI6InRlc3Rjb21wbGV0ZWRAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiVGVzdCIsImxhc3RfbmFtZSI6IkNvbXBsZXRlZCJ9.wOS6bpyrUdHwRknySnDZa8RgrBKmHpPO7QDj-VYXCPkAraz_nbA6dyJuRoqjf1pfxiW8KPJ7uyoVs9s7FigyDgcVbFBMg6mfcPNeHgcGbtjFvIXE9LzMOG-jKeAlDQNPIA-ZOJrdv3NjvX9aZ2byxClbkVIKkdXJN9djFegF_PZAbnLL7cSjdJ5AGqrjq8POXc_E83DqXbb150Zr37oPlyKqOtCqUbHzx9M29tiEPdwFxPatqdWH1M_AqUsW-KGEyvpzwkR9SnTrs-DF7hknXjmWCPe9u3q-CEQDYiUChUewahGVgfkD6sV-vOvpX76GwLg1M6Xj5PKqSt97dbITEw", "refresh_token": "eyJzdWIiOiJ0ZXN0LXVzZXItY29tcGxldGVkIiwiZW1haWwiOiJ0ZXN0Y29tcGxldGVkQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IlRlc3QiLCJsYXN0X25hbWUiOiJDb21wbGV0ZWQifQ"}}}	2025-11-25 14:34:32
1a75zX6M6EBALOxrfIBa8zyANojvhN6T	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T20:48:29.057Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763588908, "iat": 1763585308, "iss": "https://test-mock-oidc.replit.app/", "jti": "e5d7f3cef95888a8f82b584033e279b6", "sub": "49819811", "email": "afolinks@outlook.com", "auth_time": 1763585308, "last_name": "Links", "first_name": "Afo"}, "expires_at": 1763588908, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNTg1MzA4LCJleHAiOjE3NjM1ODg5MDgsInN1YiI6IjQ5ODE5ODExIiwiZW1haWwiOiJhZm9saW5rc0BvdXRsb29rLmNvbSIsImZpcnN0X25hbWUiOiJBZm8iLCJsYXN0X25hbWUiOiJMaW5rcyJ9.wru6rSaEtB15T9b19_1ycV6lfs7WsQclK8lsM8ouQq8RqFBVFuKMDTB-NjtXJocHfbfXxDVifYaQGxPzZJmOfDZbuPUj_iTEfH4DKVjXxyuWmtkMZGckXHoYoXiE6FGI6tmVoLjaYvPeLLV2wnkOGDi3WIknBLlp3YhW48pM_TL9Eb66AqeGr4r-2fXJ6voWOMJ7k58a1DooIwElWbzq6EBq6hT3ATdywrNL8TQMI-64dTWGFRrqqP66jYxgKYcBb_opXdZhEfVS0jQoog1fd-mfMy-SjPtszbE_UD7xAGsuVdHmeTIXhB7OeUoJ-3S6AO51BmONufINgrWy8gx4ig", "refresh_token": "eyJzdWIiOiI0OTgxOTgxMSIsImVtYWlsIjoiYWZvbGlua3NAb3V0bG9vay5jb20iLCJmaXJzdF9uYW1lIjoiQWZvIiwibGFzdF9uYW1lIjoiTGlua3MifQ"}}}	2025-11-26 20:52:23
llBjZcK_z7hgaCCmNNMF6sL1A3aE1Aud	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T15:59:56.967Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-11-24 16:00:15
ErE6xDI6CEQ4oTIGIHBqW4pZnSsYN9fX	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T19:52:58.547Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763412777, "iat": 1763409177, "iss": "https://test-mock-oidc.replit.app/", "jti": "4976439bcd681d15dcdc8144ed8e6051", "sub": "wvn6dV", "email": "userwvn6dV@example.com", "auth_time": 1763409177, "last_name": "Jones", "first_name": "Bob"}, "expires_at": 1763412777, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDA5MTc3LCJleHAiOjE3NjM0MTI3NzcsInN1YiI6Ind2bjZkViIsImVtYWlsIjoidXNlcnd2bjZkVkBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJCb2IiLCJsYXN0X25hbWUiOiJKb25lcyJ9.uiCCPSyyMew2erw2ZYY9ClJO0epDHcSmQB4o3F-0ZRaFxdEwjf7e_hxEPTa8QHgAJFCpm0RPTOUQImoutwu8jIRVSfEoC19wGwOCvvz4NJ2-Gc4Qm6odlOgj0XoceeYH4N1QnG9Ur500cm2YUz1CW55bHugL1EYhQyJzJ09llmOrUuAUgORIqQvXh_dMwOh7l_OM4x-04wKwTgGisMJiQCRVQTJBYQ7lH05Zn8IE1dGAQvWEP2fEpMJXAzFua7vN5TEzwnUV0U2aQ-4slnU4N45WLCtzGEMf8xkf0KHAdlrinJuke-4Rw8NTm-umYRE3IqjPts-heAOLlV4YI8GafA", "refresh_token": "eyJzdWIiOiJ3dm42ZFYiLCJlbWFpbCI6InVzZXJ3dm42ZFZAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiQm9iIiwibGFzdF9uYW1lIjoiSm9uZXMifQ"}}}	2025-11-24 19:53:20
YAijaB8KAru6ZuY5zvQSyf6rxgOZfVk6	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T19:48:01.519Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-11-24 19:48:06
MZX1g72mnzSle_iWTYlyeE6z6Hy1Zun8	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-25T14:36:54.590Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763480213, "iat": 1763476613, "iss": "https://test-mock-oidc.replit.app/", "jti": "dc489ccd4edd7d722dd862db78cd81ac", "sub": "debug-user-EbvOjy", "email": "debug-o1GDk@example.com", "auth_time": 1763476613, "last_name": "User", "first_name": "Debug"}, "expires_at": 1763480213, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDc2NjEzLCJleHAiOjE3NjM0ODAyMTMsInN1YiI6ImRlYnVnLXVzZXItRWJ2T2p5IiwiZW1haWwiOiJkZWJ1Zy1vMUdEa0BleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJEZWJ1ZyIsImxhc3RfbmFtZSI6IlVzZXIifQ.Y95ISg9zlVTauk4rQizLXCuYbsD7j-FsaiTnR0DJBfLlrK83-1qCAT8TR889S9t3iQTyQKucK8ZcYxpYO53_iOkmifwTc5OLCO_lqSKbeNbz-F1toHtMBq10aZKVyIlMvDxmR7F9kSZcWtSx3swcnoX2z-i-TRke9EfZivF7rv4mF7RyAw28a3IdTtVPovHibSF779_ulD05Z56LMVfNP2Liwn5ew__Agbf-B8yZxsHxeWm75zTXrZAhfJ6bjw5_FEUnsr0Y5-JDQyZtiHvOgJttPSqsS5j0iBz23Bxh2Vhuh4ldxn7UO7KfTpDuAE98fnSg-F0kwAkwzPwx2YRWSQ", "refresh_token": "eyJzdWIiOiJkZWJ1Zy11c2VyLUVidk9qeSIsImVtYWlsIjoiZGVidWctbzFHRGtAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiRGVidWciLCJsYXN0X25hbWUiOiJVc2VyIn0"}}}	2025-11-25 14:39:32
pv8k4tyHtLBBoTF0bHoLMw3KU9BemOA2	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-28T17:36:38.054Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763750197, "iat": 1763746597, "iss": "https://replit.com/oidc", "sub": "49819811", "email": "afolinks@outlook.com", "at_hash": "WCQh7eGdGwMIqazIqMEm_w", "username": "afolinks", "auth_time": 1763653782, "last_name": null, "first_name": null}, "expires_at": 1763750197, "access_token": "6bh7BRdjRpm1BP8FBRdS8dC5bFfZ9OTJz0LwtK5-TsH", "refresh_token": "uAx2Njt-B1pPLvz89VPu6KOwQ_lu9DGMta2klMlqXdn"}}}	2025-11-28 17:57:38
uPDxa-ZNceKXAIGBejNURG_NRr_ehzhf	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T16:47:41.333Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763401660, "iat": 1763398060, "iss": "https://test-mock-oidc.replit.app/", "jti": "8b9d66ad4b03f19bb1684485cd46b4d7", "sub": "5i1n1J", "email": "userdXZtnG@example.com", "auth_time": 1763398060, "last_name": "User", "first_name": "Test"}, "expires_at": 1763401660, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzMzk4MDYwLCJleHAiOjE3NjM0MDE2NjAsInN1YiI6IjVpMW4xSiIsImVtYWlsIjoidXNlcmRYWnRuR0BleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJUZXN0IiwibGFzdF9uYW1lIjoiVXNlciJ9.rflrrTWVnYTKBKBTK7F1yEWreU37cateTx-R4mJkSj6l71dHlu6wnpyAqXxMWskJIcRybkLYxllZAH8QsKNXFnEmiU3hfHwutCk6tsK9AYdtrSjg1R47G5ZOTfnQX-d9VEObfyLTLoS9TqzSxZ5CxNQFFltDFENqTym_JFlEToniRSvAVK0Jl8vBff7hfUPvmYH7OXd6E50-TExcWwN24FbhRMjwVp8M3KyTMJfZUa982E9kJ7Tb1SWEoprNJBDVITFhBK5LtohQ43-2o5M9zLHMAMROK6GekVpOt8ZCV3Iojd9ShRz9-WjNQy-rxfit97Fcu9flA4a4Udc2pFSovQ", "refresh_token": "eyJzdWIiOiI1aTFuMUoiLCJlbWFpbCI6InVzZXJkWFp0bkdAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiVGVzdCIsImxhc3RfbmFtZSI6IlVzZXIifQ"}}}	2025-11-24 16:48:23
eN_iCLq-zjGHVRlEVE0CvCKBHMAnB3JX	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T16:52:52.992Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763401972, "iat": 1763398372, "iss": "https://test-mock-oidc.replit.app/", "jti": "308060ff61e020938caaa6e840ee77dd", "sub": "NUdDgw", "email": "testuserqFVm_z@example.com", "auth_time": 1763398372, "last_name": "Safe", "first_name": "Type"}, "expires_at": 1763401972, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzMzk4MzcyLCJleHAiOjE3NjM0MDE5NzIsInN1YiI6Ik5VZERndyIsImVtYWlsIjoidGVzdHVzZXJxRlZtX3pAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiVHlwZSIsImxhc3RfbmFtZSI6IlNhZmUifQ.tT6LAmTq3ggLqH6LehoYoobwtKK_rYNGwmeTVKd0c_VPEBCnhB-2IYeZWJp5DDJW-VcQTBeuYlOUTAZXEvNF1pA_F6zwLn3QpKU8gL8aaHuJN9gtScxtrDVkfcBMW3myHz7HSCnEB5rrlfMh88gqOqfNLCkbByaNJk2cGhfpNNDfmveDRd8sXypF8aJ8xSEjDvWUocr91eJmxEWAlnGRX7dnOeO6lT52b7gbnSCkORZxyh2bwycQi3pzyv2JA_2UH6JVfjRvPdV7T6f20LVLQjPp8Mw6DNJQe85bdqxpkooPjvWRzbY9fy1GSDAsbeC1AVzy8dKW1m1a0-1Kxnkxsw", "refresh_token": "eyJzdWIiOiJOVWREZ3ciLCJlbWFpbCI6InRlc3R1c2VycUZWbV96QGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IlR5cGUiLCJsYXN0X25hbWUiOiJTYWZlIn0"}}}	2025-11-24 16:54:38
x7gM9VOP1DgIa3Uiza2KibuD7OpFgdqn	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-24T16:08:03.705Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-11-24 16:08:17
EdOhi60VpmXlVjEkRMBJd7V6oSCoqPw1	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T17:51:42.245Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763578301, "iat": 1763574701, "iss": "https://test-mock-oidc.replit.app/", "jti": "7096361893bf6d1a28bb17e915c213b4", "sub": "admin-test-user", "email": "admin@test.com", "auth_time": 1763574701, "last_name": "User", "first_name": "Admin"}, "expires_at": 1763578301, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNTc0NzAxLCJleHAiOjE3NjM1NzgzMDEsInN1YiI6ImFkbWluLXRlc3QtdXNlciIsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiQWRtaW4iLCJsYXN0X25hbWUiOiJVc2VyIn0.vdbtRdTnWf5wMVKe6GY4P_z-iLR29ciAMfGOKF66wMKYy0VnLMxx7hsT2ydca-li0BuBEiRhPrDRXlT7inT3mAfSxMlc1CeOdkhmMM8ziMvDBbj8JyjJsseDn0hSO87X4XMtL3KipjmiflttGJBKyeNo40d_jXX_eAyyk7CTDI8-eSpKdXeG1NP0BB6RHUBU82Nnb4VPBeSrtVfofbaPMGymHqMDqiCmDnthN4rrdSkn_syTjoCsFz6GnPdrTZ0ZP3yZH4qGedP99pbnK3Um8ACTUpsKOv4OSfRf563qzO4orA6FR0zXEbKgGfeq4aVAfS-Xt4xK_z9g00vW7KtQfw", "refresh_token": "eyJzdWIiOiJhZG1pbi10ZXN0LXVzZXIiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwiZmlyc3RfbmFtZSI6IkFkbWluIiwibGFzdF9uYW1lIjoiVXNlciJ9"}}}	2025-11-26 17:53:18
KvgZBTZLHaN9uhGBgJHTbhZCtLICBM8a	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-25T16:25:48.214Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763486747, "iat": 1763483147, "iss": "https://test-mock-oidc.replit.app/", "jti": "299e8f1c3092a86126440b62daeb51be", "sub": "fix-test-GVlcUu", "email": "fixtest4f4R0S@example.com", "auth_time": 1763483147, "last_name": "Tester", "first_name": "Fix"}, "expires_at": 1763486747, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDgzMTQ3LCJleHAiOjE3NjM0ODY3NDcsInN1YiI6ImZpeC10ZXN0LUdWbGNVdSIsImVtYWlsIjoiZml4dGVzdDRmNFIwU0BleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJGaXgiLCJsYXN0X25hbWUiOiJUZXN0ZXIifQ.EcELszlNnmyPgJqWQi9DEc_gB8P9SCOM6SIIH8c8THzMRgYEN3Z00wh6Y1ORthOU3wSiem52mP_eYA77TNtsP43mGzi78cut9iyvC3x23fs7kbUFbQz99Ju9gttB_NmAHrAtV5EZlJ9Pu0LiZhv-cJHQvXty5RYqtBKWC6r78t_QAVKn4pERKP28yOdP43FjNhF-O-FIoaEOyHVYtJOoKdQ3bUcQY6Ax9Cl4NaR3WyCQCX2FnGy-agdPkRSva-m_nb5PWJVAZO56DLD3xpPoGmzJ5PPZtPZAh8SE6lSIpFS4-KMPDP9Pk6UWZbSbHUgbYJezouNxmDi_ojcKvupiYw", "refresh_token": "eyJzdWIiOiJmaXgtdGVzdC1HVmxjVXUiLCJlbWFpbCI6ImZpeHRlc3Q0ZjRSMFNAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiRml4IiwibGFzdF9uYW1lIjoiVGVzdGVyIn0"}}}	2025-11-25 16:28:10
EdyH4SQQKM_KXOQawrO5WxRCauxWdJfV	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-25T16:03:03.036Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763485382, "iat": 1763481782, "iss": "https://test-mock-oidc.replit.app/", "jti": "72d4bf768f40b38dcc41c742f92297bf", "sub": "solo-test-JQMUgo", "email": "solo7Midga@example.com", "auth_time": 1763481782, "last_name": "Tester", "first_name": "Solo"}, "expires_at": 1763485382, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDgxNzgyLCJleHAiOjE3NjM0ODUzODIsInN1YiI6InNvbG8tdGVzdC1KUU1VZ28iLCJlbWFpbCI6InNvbG83TWlkZ2FAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiU29sbyIsImxhc3RfbmFtZSI6IlRlc3RlciJ9.o061S0MltcYf5QxctxJ1XINgV8k18Du12rx8-yCe6kxtWDok3GCy-iwoERtk9dEAg7qX-9HjVeweLt_MIy6taWdY90oFEQ-kroI8J_VWX85XWUgAtp_ZyrmaBiaUtFBbjHkBFOWWJ55QVWqLJH-uG4X4md4AKDyp23QS0admjqaRCfi6OqhNUAdpd7u0q7jVo4jF1sZ7Hf2_3-rFsYpldcyY1nKDr6YEFGuzX2r06cBmPHMw0jZjcwMxLNlxunxrJ0z5lU-6k1DrteAzcVvTvgvWh1OS76Xg5LXMkVmDy3QMwc6RalJD7V2bvtRqdVa80PG8XL3ICKM62NSy6l-4nw", "refresh_token": "eyJzdWIiOiJzb2xvLXRlc3QtSlFNVWdvIiwiZW1haWwiOiJzb2xvN01pZGdhQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IlNvbG8iLCJsYXN0X25hbWUiOiJUZXN0ZXIifQ"}}}	2025-11-25 16:06:37
nO2D_3y_kyRdRdFlHwmqQGxcG5ur1GIz	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T13:01:49.000Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763647307, "iat": 1763643707, "iss": "https://test-mock-oidc.replit.app/", "jti": "b231b48288130d91a9394db31d658388", "sub": "Ufr0avzTal", "email": "joinerGDYWAJ@test.com", "auth_time": 1763643707, "last_name": "Member", "first_name": "Jane"}, "expires_at": 1763647307, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjQzNzA3LCJleHAiOjE3NjM2NDczMDcsInN1YiI6IlVmcjBhdnpUYWwiLCJlbWFpbCI6ImpvaW5lckdEWVdBSkB0ZXN0LmNvbSIsImZpcnN0X25hbWUiOiJKYW5lIiwibGFzdF9uYW1lIjoiTWVtYmVyIn0.CPIKOzbKSxmqevEo9jrK2AZ53FfvGFT8hyOC-F_jfgeVj5KVXqTqx2AdAe9rK-bkj3Q3kXL6hmUR3P0FO5L1bawC_-UAxY8n8L22TsNV9NbdlFiGQPrFS44QDza9C3Txbp0WDKBRQkuLfLexnnX6iobfmdCoLqTUaIoV_dJb2rLnV7NbqmXFrr4iOMEil5qsqt4tDGKJL7dqQbcwSJ8k9rv1HueKnBoHHD3og3hUD76TLivkLPAX1Uld1M-MlSaJcgfnpXeuCQI5nQ4pyIstfECKoezizVoYaq5CL_vuWPF7Bp2mU0scEKbO25wuWC8Le-gZOkkZczbmKfIxUrQY7w", "refresh_token": "eyJzdWIiOiJVZnIwYXZ6VGFsIiwiZW1haWwiOiJqb2luZXJHRFlXQUpAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiSmFuZSIsImxhc3RfbmFtZSI6Ik1lbWJlciJ9"}}}	2025-11-27 13:03:26
2n7_WupB53tZp_0-Bgr2UhIOjZoRtHO3	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-25T13:46:39.151Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763477198, "iat": 1763473598, "iss": "https://test-mock-oidc.replit.app/", "jti": "d7d3122455f3673207b6c62e98d6595a", "sub": "ZP17pr", "email": "ZP17pr@example.com", "auth_time": 1763473598, "last_name": "User", "first_name": "Test"}, "expires_at": 1763477198, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDczNTk4LCJleHAiOjE3NjM0NzcxOTgsInN1YiI6IlpQMTdwciIsImVtYWlsIjoiWlAxN3ByQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IlRlc3QiLCJsYXN0X25hbWUiOiJVc2VyIn0.x7p3QRNN8KbwGDXiftSGiMoZ5e-AQcMrEzO5o4MNkrFFkr-GW-4FqMnJdwol25HbBHAlxbxUmAI0t6zm-3Cy4L4497XKXG_aBNhiqbIm-djiFeuqshEDhUu57_JLBRFWplRO1UNKyZYqXuvfTgFD5PrRrWhGIGFPNIZrb19xUyWS_0DUEvIVUP4r6wzDu7YElXoArJX_uNgUhNXGkMeB8RPJbVqUrOsroO67Io4bmLI_yxy8WW4lGvKa0XzR5h_oZdHMWlF7XXcY28qm2VIYqfJjsYF14iFKN4wiy_Zbe3Xntrdy1uolWtRDQ1o86xfvAhexQR4tMuAbID4f0Jprsg", "refresh_token": "eyJzdWIiOiJaUDE3cHIiLCJlbWFpbCI6IlpQMTdwckBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJUZXN0IiwibGFzdF9uYW1lIjoiVXNlciJ9"}}}	2025-11-25 13:48:15
PrWt_1KiQjpoVq7k2bpQZ12RD-y_NBLy	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T14:04:09.251Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-11-27 14:04:10
EJgufuVRIg692fFvPJUbPNRZ2asFPS19	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T19:04:53.811Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763582693, "iat": 1763579093, "iss": "https://test-mock-oidc.replit.app/", "jti": "fdd488184378f30963722cffb11cf6be", "sub": "49819811", "email": "afolinks@outlook.com", "auth_time": 1763579093, "last_name": "User", "first_name": "Admin"}, "expires_at": 1763582693, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNTc5MDkzLCJleHAiOjE3NjM1ODI2OTMsInN1YiI6IjQ5ODE5ODExIiwiZW1haWwiOiJhZm9saW5rc0BvdXRsb29rLmNvbSIsImZpcnN0X25hbWUiOiJBZG1pbiIsImxhc3RfbmFtZSI6IlVzZXIifQ.gnOb9-lRe47i0wMeGC7ho-vbOQXd_HxyjiXZWQbF6xtGJhdGqPgHh02D0-32Ct6GlJi40rSPEW6tUPk0R2yxGCYxRKQqwJqE6LfJGstOi8nfyaDtINtpGbWs61QFxCCV7ng_ICMPN1c9Y064u5NGQtyHMskgVpqBzCfR5U-Xt9DMStIk582GxDBCGR2ZEAYFIyiMawr0Jtijym9I8OHAmgwfBVs287PBOHAWHxhLENQVBTkHUD0nF7iQeTLFeyNfMWduQzDAhLMKOuMlP93VlxiIETwNUHXUVlTYyZdjCHnsMePCgXaoXFAqId2IYTyNOM_MGqrXQcEnXBi099dABQ", "refresh_token": "eyJzdWIiOiI0OTgxOTgxMSIsImVtYWlsIjoiYWZvbGlua3NAb3V0bG9vay5jb20iLCJmaXJzdF9uYW1lIjoiQWRtaW4iLCJsYXN0X25hbWUiOiJVc2VyIn0"}}}	2025-11-26 19:06:01
T5ecU3p1wPZjXrsO_ptjoRGDV06TflCi	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T20:43:40.598Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763588620, "iat": 1763585020, "iss": "https://test-mock-oidc.replit.app/", "jti": "91936c420ba8bb50e22800962b948452", "sub": "49819811", "email": "afolinks@outlook.com", "auth_time": 1763585019, "last_name": "Links", "first_name": "Afo"}, "expires_at": 1763588620, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNTg1MDIwLCJleHAiOjE3NjM1ODg2MjAsInN1YiI6IjQ5ODE5ODExIiwiZW1haWwiOiJhZm9saW5rc0BvdXRsb29rLmNvbSIsImZpcnN0X25hbWUiOiJBZm8iLCJsYXN0X25hbWUiOiJMaW5rcyJ9.ITD_yluJCUtQDxGoH2aXZZJ5CA6uUMiFK6VR6-PdRPUm3OYU3LEAqy9CMiwwAq4IZG9uzkZoVpi_t-yGPtkufl4WeOBTZzSohpc1S2pXgPzE7hKqeFZly_tadsNNnut05DMLpGfhOcDWu6wCkEU3rZUhI1QbzXr6g7ipjIchA_ye1OJ37h7HWc2JQwG_l0N2qHQp8XoIP1yCoigKOLEOzX4UbxRIatbYvJo3bELvOWg0RUfmbInO44jeyRkdTajSC7ZUge61QT38I9QyKYGL-psFRMyj5NdKGt6E7aytteafp6qMMnXqCNPMKrJbtVqvsXt5HLOmrea5W3cTdaCaGw", "refresh_token": "eyJzdWIiOiI0OTgxOTgxMSIsImVtYWlsIjoiYWZvbGlua3NAb3V0bG9vay5jb20iLCJmaXJzdF9uYW1lIjoiQWZvIiwibGFzdF9uYW1lIjoiTGlua3MifQ"}}}	2025-11-26 20:46:48
zfn7YelYw_8kiBgZdCVIEfQLnQS0tcrU	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T13:06:57.688Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763647616, "iat": 1763644016, "iss": "https://test-mock-oidc.replit.app/", "jti": "d15cadd1c3e3e56e60e0e13ebf3d6f21", "sub": "wnWdbyQaa_", "email": "creatorxDhYfj@test.com", "auth_time": 1763644016, "last_name": "Creator", "first_name": "Sarah"}, "expires_at": 1763647616, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjQ0MDE2LCJleHAiOjE3NjM2NDc2MTYsInN1YiI6InduV2RieVFhYV8iLCJlbWFpbCI6ImNyZWF0b3J4RGhZZmpAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiU2FyYWgiLCJsYXN0X25hbWUiOiJDcmVhdG9yIn0.l7x-mkunQ-IRTNpbtX0RT-m1_zcF1moBX0G8O4-KNE0hwsgJmxUXW6V0yFFRj_LfzlJ-pqHx5K2__O5WjBmEE4Ji1C_JeQh__GPoQua6G2gkrVyUWDafno3KQEgGxF5RB0ysWkjwnQec_-feiwe3osiSbp5z7zS6dvcxeKl9j8GPuY6lZ4Kybg0ia3G_HXolRpOIKVJtw79IQlzkBFr3Ir-7iO6Mpi4YiJulOq8cYyu7EFaA8uOhyp1NZIYYjmndSk9aDV2-2sC4Z311NA3W3o6b7mZupsQau27itEgJNjlrsqK-4OX6JKB40uabBHhil0Ulf333eL1t_SJ7TY6IDQ", "refresh_token": "eyJzdWIiOiJ3bldkYnlRYWFfIiwiZW1haWwiOiJjcmVhdG9yeERoWWZqQHRlc3QuY29tIiwiZmlyc3RfbmFtZSI6IlNhcmFoIiwibGFzdF9uYW1lIjoiQ3JlYXRvciJ9"}}}	2025-11-27 13:10:42
mzdmSWKTnM8eMiiomhu-kBYdf62cwy-K	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T12:58:45.090Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763647124, "iat": 1763643524, "iss": "https://test-mock-oidc.replit.app/", "jti": "00e20d5af163254a6eb4748a2a6af923", "sub": "qcrc9pvtFs", "email": "testcreatormtoxQQ@test.com", "auth_time": 1763643524, "last_name": "Creator", "first_name": "John"}, "expires_at": 1763647124, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjQzNTI0LCJleHAiOjE3NjM2NDcxMjQsInN1YiI6InFjcmM5cHZ0RnMiLCJlbWFpbCI6InRlc3RjcmVhdG9ybXRveFFRQHRlc3QuY29tIiwiZmlyc3RfbmFtZSI6IkpvaG4iLCJsYXN0X25hbWUiOiJDcmVhdG9yIn0.CvlM27fmfkpKvCA745X5pFetlQC7dB0vyI7jzE8QoW48NnD2vRSzZPipby1FRt66PGZgtbxh5N66f0v053r5zINJArpyrwdAWtjY5emoQKgTQL-zHXhXU_Ljj4af3hvtguhVt2Cq3_tpiFQIOx54-AbjLHUuUNHncVc7l7tBtwxjWUDO6ZziKcBTIqafPIOjsZ2fI7elT9JcTgxBLxRrCW7FOWIjAu3Cw-rcDfFAdm9fDxSW9A3FRMvSZ4DskalbhHN0hTkLGnY2Grrg-KQb8jSNTpzH1ostubkYZNPGjWurEemt7lBQ2E6PLrjEM6gnSC4EZblFd-8Jy2oCHWDS7A", "refresh_token": "eyJzdWIiOiJxY3JjOXB2dEZzIiwiZW1haWwiOiJ0ZXN0Y3JlYXRvcm10b3hRUUB0ZXN0LmNvbSIsImZpcnN0X25hbWUiOiJKb2huIiwibGFzdF9uYW1lIjoiQ3JlYXRvciJ9"}}}	2025-11-27 13:03:29
kYwxiwxsNvjA4qP9ZeuKelK1VztDbBCy	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T19:08:22.859Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763582902, "iat": 1763579302, "iss": "https://test-mock-oidc.replit.app/", "jti": "047694dfc83fe1cdcfb6dd9551c82c6b", "sub": "49819811", "email": "afolinks@outlook.com", "auth_time": 1763579302, "last_name": "User", "first_name": "Admin"}, "expires_at": 1763582902, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNTc5MzAyLCJleHAiOjE3NjM1ODI5MDIsInN1YiI6IjQ5ODE5ODExIiwiZW1haWwiOiJhZm9saW5rc0BvdXRsb29rLmNvbSIsImZpcnN0X25hbWUiOiJBZG1pbiIsImxhc3RfbmFtZSI6IlVzZXIifQ.aQIa72XAPj6tvn4gRWZh7g78yw5ablLMhcwBwYrI2oJb4B02_rEnVKyNML00bnm32FCEVE27aSyDpO09I3A85OHzYMZshqFghaYTcxQ2fYYfgqpFxZDlxF17OnLZISygmiggtf1ehZopmkZ7xuEEfm2jplOlEzamj4IvMKkEIALeQxhBuNnbG5QCTgg441ytPLEZH-IskaAjixQsDEBFbAVPLZKvE8pHccE6a4CmZPaKsMPkLFHDRaqtKhvD4NwWQy5ukNw8u8JyG2qezo0_knYfr7j1zObK1AgAZppChsrLShGzDPALV-gFl0mxO0DHFDzaIldnckwPGc5yM8bfPQ", "refresh_token": "eyJzdWIiOiI0OTgxOTgxMSIsImVtYWlsIjoiYWZvbGlua3NAb3V0bG9vay5jb20iLCJmaXJzdF9uYW1lIjoiQWRtaW4iLCJsYXN0X25hbWUiOiJVc2VyIn0"}}}	2025-11-26 19:09:27
tz4SvwnVAHrwY-TsimP_FA29-XLx6l8g	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T18:53:09.211Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763581988, "iat": 1763578388, "iss": "https://test-mock-oidc.replit.app/", "jti": "2fe8c7956b6bf563e1f4afc3be2c56f3", "sub": "49819811", "email": "afolinks@outlook.com", "auth_time": 1763578387, "last_name": "User", "first_name": "Admin"}, "expires_at": 1763581988, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNTc4Mzg4LCJleHAiOjE3NjM1ODE5ODgsInN1YiI6IjQ5ODE5ODExIiwiZW1haWwiOiJhZm9saW5rc0BvdXRsb29rLmNvbSIsImZpcnN0X25hbWUiOiJBZG1pbiIsImxhc3RfbmFtZSI6IlVzZXIifQ.LzHYYvQs4wD3D4VMqVW-Fn7VBepDhZ9LBSt-eiMWGAb-GxpDu5TRp2zlpe-jusunBZ3LWo9CM01kdjD6uoL6cp0vUM67g5K4ByoBSdfRLwRcbSNZMhc05uLSuhn1YTorFq_-0hA4eJFc90lsETHFAzf4Lon6q0_kXd3HjaA4-AtkajdBkYv2A6yZVjOJ62PxAOyQqw34v-EIcGAJrV72MnHL0YhFNnPBKkPPYPEUEd5lFlNMfi9PZ66Ziixn8pIVrlVrqMJh2q_ZYc0Qq3pcM2-j7JhTJ6GjbWG3-XDPgUG6ThRWPW2Sr4j7XyAG4pUJDrsOXQ8uaJK97KSlr5U7XA", "refresh_token": "eyJzdWIiOiI0OTgxOTgxMSIsImVtYWlsIjoiYWZvbGlua3NAb3V0bG9vay5jb20iLCJmaXJzdF9uYW1lIjoiQWRtaW4iLCJsYXN0X25hbWUiOiJVc2VyIn0"}}}	2025-11-26 18:55:43
48mKtoYyQVdBlHB7QBJs2rMTG_fNEm28	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T13:16:08.067Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763648167, "iat": 1763644567, "iss": "https://test-mock-oidc.replit.app/", "jti": "df7703e6fba2bc430f0145c1bdd2cf73", "sub": "SiC_lj9XIE", "email": "joinerboBkpz@test.com", "auth_time": 1763644567, "last_name": "Johnson", "first_name": "Bob"}, "expires_at": 1763648167, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjQ0NTY3LCJleHAiOjE3NjM2NDgxNjcsInN1YiI6IlNpQ19sajlYSUUiLCJlbWFpbCI6ImpvaW5lcmJvQmtwekB0ZXN0LmNvbSIsImZpcnN0X25hbWUiOiJCb2IiLCJsYXN0X25hbWUiOiJKb2huc29uIn0.tKiZdFzWoR0e5NeAV455uMreiufqNKGI8Ouu7Av1q9JscyzSyAFerBo78EJRY5HUy-ppmV_ExNWuwtulKvsORNmckxGNPvOQg_sjmc4IGsxoyNVagzIEYEw87jqpMMzpa2DllWtBjTbfoQpSa_o41WyKKDNOxiz8Nqp53vGVGpqs1-JG2LnwpnrVrelzIJlCC80w8NwpmIHWy-vjWuI_k9luFGa2pbDgc6VQXKfAYutsXo6I2eHaSDuYGFmJq2qCoLtANNWhAEdBAfuapHaN4IV7ENZVEQzStFLlMz4oVAJRW8Ph0YfNfHGF1X6RhPI98DnykwHcoCVxXDJErfjMOQ", "refresh_token": "eyJzdWIiOiJTaUNfbGo5WElFIiwiZW1haWwiOiJqb2luZXJib0JrcHpAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiQm9iIiwibGFzdF9uYW1lIjoiSm9obnNvbiJ9"}}}	2025-11-27 13:17:01
ZnrJBpVr-8_xrnvonp3240xTxwYCAMx_	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T15:05:40.269Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763654739, "iat": 1763651139, "iss": "https://test-mock-oidc.replit.app/", "jti": "b26612a12a96d3321a397d80d6c3b7c5", "sub": "xgaUXs", "email": "xgaUXs@example.com", "auth_time": 1763651138, "last_name": "User", "first_name": "Test"}, "expires_at": 1763654739, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjUxMTM5LCJleHAiOjE3NjM2NTQ3MzksInN1YiI6InhnYVVYcyIsImVtYWlsIjoieGdhVVhzQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IlRlc3QiLCJsYXN0X25hbWUiOiJVc2VyIn0.xtUkZSTLbKVe3ePkc11H0pp-SkVwG0qbbTADAX6XP-ai0gulCV5K_XPT1jrZHk6PDXj1smUZYovjdy_x-LHMSaJl0KKa-0uwsOvIQk7aSxOt8VHuHf_eHeCEaR2MygKMcnXoEkHiDpwHPGHvz4HL15lQOMViwOOmK6TMGY9Yw6tgPCig94DfRmsfr4nJ6GFwGHPhkFOz-Z7sm56h9Bu9TZvLJeegg9vGQ4NeA8z3OII1yPqrC-dUu7nihNP9V-xCzJIXl1XWLV6qtoftlSAchYsj8CZGYxMnvop5k7DK8r1w1HsGJ8cfj-7zBpQdSADA8AE_WQARpZ0Zo8to_ILb8A", "refresh_token": "eyJzdWIiOiJ4Z2FVWHMiLCJlbWFpbCI6InhnYVVYc0BleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJUZXN0IiwibGFzdF9uYW1lIjoiVXNlciJ9"}}}	2025-11-27 15:09:24
OIFZjOQdSGXWbOyIW3eIFkpYh61X02mE	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T22:15:01.299Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763594100, "iat": 1763590500, "iss": "https://test-mock-oidc.replit.app/", "jti": "a9ff483a9e046c9a7a74663ec93ebe65", "sub": "_D4Ir3", "email": "_D4Ir3@example.com", "auth_time": 1763590499, "last_name": "Doe", "first_name": "John"}, "expires_at": 1763594100, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNTkwNTAwLCJleHAiOjE3NjM1OTQxMDAsInN1YiI6Il9ENElyMyIsImVtYWlsIjoiX0Q0SXIzQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IkpvaG4iLCJsYXN0X25hbWUiOiJEb2UifQ.Thll3QH0WOD9pYqtvsNDwWa0oQtSdOBkl5DO4X2n89rSRCIK9IyVCFbDQxlyPRCBcevnbDyplexeCgRx1cyQMu5Iw1uQKMshTyFNGceUw0S_3cG8GDgFlXTmgQsTtUNg3n3JjBmRG0I07IFxE237prxSDqdhyIVZ0NJPlsuy7pTGQQfNPu8uKa0xJ9YZW94ROsLbXMFKMg_RsZNvnR--QsF_4XbgpjsFEXoAjIyoUuxL2W3m-vyWTSTLVZrG_52TDKQkUG27KaelnqOZZh9fVQnxA4l0cdpU30gkLCZi_Jq6tLP3ra8cXELQshhs8Pfof14VPPn8v2JMmvmu60YFBA", "refresh_token": "eyJzdWIiOiJfRDRJcjMiLCJlbWFpbCI6Il9ENElyM0BleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJKb2huIiwibGFzdF9uYW1lIjoiRG9lIn0"}}}	2025-11-26 22:15:07
HLxA844zYb0U4vmYXKpOs88D4tyUDHuQ	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T18:05:33.364Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763579132, "iat": 1763575532, "iss": "https://test-mock-oidc.replit.app/", "jti": "3377ac334555bdfcb193b2e6451f2c43", "sub": "49819811", "email": "afolinks@outlook.com", "auth_time": 1763575527, "last_name": "User", "first_name": "Admin"}, "expires_at": 1763579132, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNTc1NTMyLCJleHAiOjE3NjM1NzkxMzIsInN1YiI6IjQ5ODE5ODExIiwiZW1haWwiOiJhZm9saW5rc0BvdXRsb29rLmNvbSIsImZpcnN0X25hbWUiOiJBZG1pbiIsImxhc3RfbmFtZSI6IlVzZXIifQ.XVJUkvk56d_-A0ONGvZe_sSp_STyKqml6xh4OcGxFXVh7xi5t9Qy12hMDSoH6r3SPjBWVE4c-3iO0DMTOJwE9Oa15CN1y8v5QlKUaIZBgoCvmPahyiEZ3epvvTVj4E1J6Z8Mjv0pf3uibGlfR1VHp93Co27Poo6cAu3H0yzdvBEX7PJ46SEF8NqCNiSz6PF64eC3Yjy9ZirRlcGYGe7vV2IoHqjEeja_lEZoIdoVxRW-NpdgD6fj3TnapQkWWkNQ8Cju5SwWddbIRpkbeqxuISKumE887HsbiVlUhN39vC0Z1krASz5xobV7--tG00f2R9C31e3kf_F0ZlhJh2z-IQ", "refresh_token": "eyJzdWIiOiI0OTgxOTgxMSIsImVtYWlsIjoiYWZvbGlua3NAb3V0bG9vay5jb20iLCJmaXJzdF9uYW1lIjoiQWRtaW4iLCJsYXN0X25hbWUiOiJVc2VyIn0"}}}	2025-11-26 18:05:44
4aKXmWoG1Yq5w_6UaGw5RuvSn9NNPG3D	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T22:27:47.862Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763594866, "iat": 1763591266, "iss": "https://test-mock-oidc.replit.app/", "jti": "472e91d84ec54abbbc9eb3c01b3234ba", "sub": "NUOt7G", "email": "userwY73YE@example.com", "auth_time": 1763591266, "last_name": "User", "first_name": "Test"}, "expires_at": 1763594866, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNTkxMjY2LCJleHAiOjE3NjM1OTQ4NjYsInN1YiI6Ik5VT3Q3RyIsImVtYWlsIjoidXNlcndZNzNZRUBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJUZXN0IiwibGFzdF9uYW1lIjoiVXNlciJ9.ZMrzerxERR7IoGEt7VWIkpB5Ej6I-RE-TpKjVA8GBguxUdXQO5FDUb8YOOHSCP-ZdT8vXrYsAcwDgtFk2D0byO8N9BK4VIHaAx3I_H4jcD_xVH3SMDqWCd5ZSsgeiuq2pBASnJLsIqscOOuegvwxXv0kCS104YBz1kT5E3nTa46WVsQaHDavNtYMVOPqcU2Zz8AgX6krhwLN9bGqfVriD9NRnaRHfx9Rm3e5MSRcjs65Drbjjeop1bDZwN6FJsOQvx4hnKxoJLjnokUhewe6lk_D-b5zgB9jOIG15N07z-URQalk_oWREEIO15HVj2oNtHPMpJRd_H9VxnYzQ0RTeA", "refresh_token": "eyJzdWIiOiJOVU90N0ciLCJlbWFpbCI6InVzZXJ3WTczWUVAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiVGVzdCIsImxhc3RfbmFtZSI6IlVzZXIifQ"}}}	2025-11-26 22:27:54
nvI8qvyHw31XyyKQqDez3_A1hrHchWXC	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T11:21:33.984Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763641293, "iat": 1763637693, "iss": "https://test-mock-oidc.replit.app/", "jti": "001a4ac78d18bbcec506386fb3ee46ac", "sub": "Xdr1-g", "email": "testuser38vOr1@example.com", "auth_time": 1763637693}, "expires_at": 1763641293, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjM3NjkzLCJleHAiOjE3NjM2NDEyOTMsInN1YiI6IlhkcjEtZyIsImVtYWlsIjoidGVzdHVzZXIzOHZPcjFAZXhhbXBsZS5jb20ifQ.WIb2VMi-sLy6VcpgycrSQSgfwJYvXZoqJaV1--75_q5wMsHHLKj6QAoL5cz_9wu873VuHqA_4Vj9j-8oPu2wzHtJUmYM7M3zq51QqAKhkYsCN21GQpEdAcOjfQR66wirQHifWC_J8Z92bE7z3Ga1rZl6vqycAgnS38OXNTVV-hCkNUx44ZdaOEgOvy71J9yKfj6cEeHj0ThGuJ9m1Set3UugjRsNUHmGH8HaXEuPZMksbcjHPC7eWI0b-CS6j3gVnyHzpzLhFFp7ICEa08kOQ3oYT6Wp-IUSW6Nsb3tvLZSOBt_t4Iz2dKjMPBe3Yf9dF9u0ZZmirWQVFWld_TTOEA", "refresh_token": "eyJzdWIiOiJYZHIxLWciLCJlbWFpbCI6InRlc3R1c2VyMzh2T3IxQGV4YW1wbGUuY29tIn0"}}}	2025-11-27 11:23:12
58HZKPHJzhdEHZzJWfwaGreWA8mJuR3F	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T18:01:46.895Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763578906, "iat": 1763575306, "iss": "https://test-mock-oidc.replit.app/", "jti": "df08c402e9e83d211177d000e8bc467c", "sub": "49819811", "email": "afolinks@outlook.com", "auth_time": 1763575306, "last_name": "User", "first_name": "Admin"}, "expires_at": 1763578906, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNTc1MzA2LCJleHAiOjE3NjM1Nzg5MDYsInN1YiI6IjQ5ODE5ODExIiwiZW1haWwiOiJhZm9saW5rc0BvdXRsb29rLmNvbSIsImZpcnN0X25hbWUiOiJBZG1pbiIsImxhc3RfbmFtZSI6IlVzZXIifQ.RKFW6eM17cmzjJ2pwtxyQvQzkjGv2yczQOrEkT77Cx5bFI1dkVAbh16ZfngEvqf861nP_DhnZl0czI5ZipO2BLKL08XZeCt5apJXIBfJRhQfHdOayLkI4454nCk83XD8yZPUn5d49J7RY25qD7wi1uoJhG_ccAh7Q-qu3X9StkbOw4KwzOQfVtlwTJVErzPnsyo8rr3nVbdbEjRxkysOEf8zwCe4JtVgXP6HJlDhVcRuhLDefPZsF1Gg6AWLe4bbUTlkvYLyATB6ne_DY2Q7pytiKfJm-8QEVnVAYFbc5qSdVReaiAWwOhQhDDWQElhtw3wOgVyHLlEY2ryYvH4jbw", "refresh_token": "eyJzdWIiOiI0OTgxOTgxMSIsImVtYWlsIjoiYWZvbGlua3NAb3V0bG9vay5jb20iLCJmaXJzdF9uYW1lIjoiQWRtaW4iLCJsYXN0X25hbWUiOiJVc2VyIn0"}}}	2025-11-26 18:02:54
B0Y1HSTI19OW1GoWXZfHEWkhw0CkcBmT	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T14:34:52.420Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763652891, "iat": 1763649291, "iss": "https://test-mock-oidc.replit.app/", "jti": "99c6dc6e046e3ba711340613b1bd07c5", "sub": "A28AQO2dsJ", "email": "member38rRNZl@test.com", "auth_time": 1763649291, "last_name": "Williams", "first_name": "Carol"}, "expires_at": 1763652891, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjQ5MjkxLCJleHAiOjE3NjM2NTI4OTEsInN1YiI6IkEyOEFRTzJkc0oiLCJlbWFpbCI6Im1lbWJlcjM4clJOWmxAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiQ2Fyb2wiLCJsYXN0X25hbWUiOiJXaWxsaWFtcyJ9.S5cXL6AtQWNSkxH_1GRtlf17ErlSlW9vdSimBqUmQRZjKkQ7o-zDONRXnkvnGVTmw_bME9en2afvL7yCdwvt4t0VVhzf8w40gdCL2zcdG-raiZ70Gvj-_QX3_xwH_2C_0V97BLQxRepXQOlv94NEsyVbwxy1QPJPYOeUHxnowgPww1IjJZ73URd6dFlb9DcZmikob-zk7-9D2yrXgHQv0WJzizkZBdmjidZf7-S5m87TINXo8NlZo6OleWlv0rBGxuw-2h4R0C9W9qBjW73eVdVlB7K3dusQcu_7jgLNsmVN8eLf2PfL92jtjTPpLHuwd9xwJUbu966ZUoid4Biouw", "refresh_token": "eyJzdWIiOiJBMjhBUU8yZHNKIiwiZW1haWwiOiJtZW1iZXIzOHJSTlpsQHRlc3QuY29tIiwiZmlyc3RfbmFtZSI6IkNhcm9sIiwibGFzdF9uYW1lIjoiV2lsbGlhbXMifQ"}}}	2025-11-27 14:36:02
abeRF44kj3575Gi_PjVFCvMitYPuC8iv	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T07:57:38.050Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763629056, "iat": 1763625456, "iss": "https://test-mock-oidc.replit.app/", "jti": "edb83b7c2d602f584f51ff252e6a0a7a", "sub": "AfHySh", "email": "newuserM3dqqS@example.com", "auth_time": 1763625456, "last_name": "User", "first_name": "Test"}, "expires_at": 1763629056, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjI1NDU2LCJleHAiOjE3NjM2MjkwNTYsInN1YiI6IkFmSHlTaCIsImVtYWlsIjoibmV3dXNlck0zZHFxU0BleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJUZXN0IiwibGFzdF9uYW1lIjoiVXNlciJ9.cIuGXfl0u_kRqNKUk_OpOHcuXWvEKXin2-Mh1aC4AdZpt56hJOU21esubKYR8nyFhqDaIoUb3LhOELCgy-zxZPkGbIg-sQFQ7r4K6_K5QzcUKmQfpxj077srCFsPEN7CuldP9zl54OHDcr3mhLeRCzwLr0utrcehPaTN4VuntOMC6wl4-YAsUUSm7UtXYha4sXXwg7GmenY95kGSXfBs_yIdCXkoOtesSLAUr_9C54Zi7JgwB7stEA5V4oFRpQ3r8z4D3xefaWSOas4Ptrp0gwWhA8WlMBOpkTsU5Xa2k0kYnxA4UX8YvSwy58TbkqTQiIQf1MV99ZX3BOmNTacgaw", "refresh_token": "eyJzdWIiOiJBZkh5U2giLCJlbWFpbCI6Im5ld3VzZXJNM2RxcVNAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiVGVzdCIsImxhc3RfbmFtZSI6IlVzZXIifQ"}}}	2025-11-27 07:59:51
JBilDYpIAUI89gLOIewD2J-35TS-inDv	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T13:13:49.682Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763648028, "iat": 1763644428, "iss": "https://test-mock-oidc.replit.app/", "jti": "08f2b80a6a836e11185874957f8e4527", "sub": "ermRJcysk2", "email": "creatorDuwxK8@test.com", "auth_time": 1763644428, "last_name": "Smith", "first_name": "Alice"}, "expires_at": 1763648028, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjQ0NDI4LCJleHAiOjE3NjM2NDgwMjgsInN1YiI6ImVybVJKY3lzazIiLCJlbWFpbCI6ImNyZWF0b3JEdXd4SzhAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiQWxpY2UiLCJsYXN0X25hbWUiOiJTbWl0aCJ9.YSTyeDkt3gOm9Zzy9_2vrjnfGxfMNwsU1wyF9ls7ooQysRSJNF94lTsLmI5bT3qFsCnK3YaMcApz7DWAxqUOxGYtjOLqoDRCwbJL7v7QcY-5BauO7gYF3FXlfa32vRZRozKGMqQwIrlLf87wAzxlvXDk5-aNJryyu2kiyPp1ercCpY51jgWjWC2m-brRhQv4qv_st_5Q2HLfgpQkwPyAkvXItByboxMriDVHbHOFFUe3shrNbM-SaQF4KQTcIY0rShajfluxKlpW73gGMtYsiPLcdZxu5RUi9U_ebEN__1Orfx5RYNTaJFGNaEm4LNdPhr8HX-YXY5onoV6Az6erCQ", "refresh_token": "eyJzdWIiOiJlcm1SSmN5c2syIiwiZW1haWwiOiJjcmVhdG9yRHV3eEs4QHRlc3QuY29tIiwiZmlyc3RfbmFtZSI6IkFsaWNlIiwibGFzdF9uYW1lIjoiU21pdGgifQ"}}}	2025-11-27 13:17:03
s6oEnTTqVUnQ9VhInff41sbeTVqCYBNT	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T12:54:30.969Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763646869, "iat": 1763643269, "iss": "https://test-mock-oidc.replit.app/", "jti": "4d5748f2ec84f39be564ac53d24af7c4", "sub": "ZNwW04", "email": "joinerZNwW04@example.com", "auth_time": 1763643269, "last_name": "User", "first_name": "Test"}, "expires_at": 1763646869, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjQzMjY5LCJleHAiOjE3NjM2NDY4NjksInN1YiI6IlpOd1cwNCIsImVtYWlsIjoiam9pbmVyWk53VzA0QGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IlRlc3QiLCJsYXN0X25hbWUiOiJVc2VyIn0.YUbn2ivQz8u3YYtMDNb_34YgCkTkZJCd6UcWugPQLrAxj41ggFqFhMQzTyhyLbHBFkpLNv_V5tEAWhiLzlhjUPR6APtGx5RqHG35BCPn8IAKWGuW_UTIn_SM7HoxoFE664zjjUim4KdryvdTKwFg5m66DJmfINCAxOfg57jL-Q4aE2Bxev8BRqfVF-AlBANOuB_AC_98PjccBRFFqUijWNMauHG47saH9J_SeeXyxiD5J1zeR0hEz-w8n-TiEn_yed9i7dF_vaCX-cW-lxOlbhb4DVwFLe3y8hp3UJCmyHSfQTq9ExjQB7oDXJUx6_5KQiallSJXVSM9W-Ysfur-8w", "refresh_token": "eyJzdWIiOiJaTndXMDQiLCJlbWFpbCI6ImpvaW5lclpOd1cwNEBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJUZXN0IiwibGFzdF9uYW1lIjoiVXNlciJ9"}}}	2025-11-27 12:56:59
k-KmeZOw53rBTOO8mWeXE0Jup1S_-xbm	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-25T16:31:16.947Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763487075, "iat": 1763483475, "iss": "https://test-mock-oidc.replit.app/", "jti": "757df16b7f3207b436a160161196dadc", "sub": "race-test-d4kbX_", "email": "raceSIA1P-@example.com", "auth_time": 1763483475, "last_name": "Test", "first_name": "Race"}, "expires_at": 1763487075, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNDgzNDc1LCJleHAiOjE3NjM0ODcwNzUsInN1YiI6InJhY2UtdGVzdC1kNGtiWF8iLCJlbWFpbCI6InJhY2VTSUExUC1AZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiUmFjZSIsImxhc3RfbmFtZSI6IlRlc3QifQ.rY5PV96YizpIAsgPJVeZDwoi3S7QhrMuKOkpTFJSLUgySeqYZuh3I9kyBllwl_rHi07sny_eeBfLZkvbI_kD0wr9dlLr1RZZl9ZLQtnqP_I54bVUBMQWAX4ePx5QV6uLYgrj4chMbCJ5jZmg-jLn8E7WNPR169MyTr5_YUwMKqinf-EC_PCYrdOXq5S2NNGDpodN9j0JfN_OCcqFexjWdp8fJafmBD4lPs4TdSqktkwSKbr5RRGfgUyEU_JXb2VJa3kVjzXV9vpKjV146j8NhISQLKJLjrJLJuJ8tDVW45STE4k_6E8E1ujaBiMa3U46IXq7cR22aXsu81WNdJcyvw", "refresh_token": "eyJzdWIiOiJyYWNlLXRlc3QtZDRrYlhfIiwiZW1haWwiOiJyYWNlU0lBMVAtQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IlJhY2UiLCJsYXN0X25hbWUiOiJUZXN0In0"}}}	2025-11-25 16:35:15
KL-To72zWxTFd9tOAmj_80VSin9Uh96h	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T18:20:35.209Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763666434, "iat": 1763662834, "iss": "https://test-mock-oidc.replit.app/", "jti": "f6dda1ee0c5be61731cd06ba7a0ffd70", "sub": "49819811", "email": "afolinks@outlook.com", "auth_time": 1763662834}, "expires_at": 1763666434, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjYyODM0LCJleHAiOjE3NjM2NjY0MzQsInN1YiI6IjQ5ODE5ODExIiwiZW1haWwiOiJhZm9saW5rc0BvdXRsb29rLmNvbSJ9.jalMhzGUrl0bX7G4GLvA1xW1_7XVjttFZezhPj0K7ozVaTBjnEzqZBRnSt8Mac_Fp1ZBOQAXkQ9EXXHMd6Y3ovy8GgmbqHCyuuIBbqC1rI3k6pT4LOTzwJrYfglQvYSRgqmVoYgoftRbRo4ZVNKCZG3lj8RON21TAZd3ImEO6GQDxhiCa2dL16IpxIUQlKdtRb2jbeIwYWjvSpNvgRsN4K3CJz8mOg5qU2ZYXQ-_tYDQzbqrWDZFZc49alSLkdSHwPrZ7Hr3YDXGBIOxayH-OD1W8bvcJ5u24xlLDnAS_43j2s5ReM9POh_aNK3Sj6BJhs_IypaxHJ0LA0oIQKtm8Q", "refresh_token": "eyJzdWIiOiI0OTgxOTgxMSIsImVtYWlsIjoiYWZvbGlua3NAb3V0bG9vay5jb20ifQ"}}}	2025-11-27 18:23:43
NxT55hEiLM1Dn-p11Cfpgo0QIyCLLO8c	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T14:39:09.635Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763653148, "iat": 1763649548, "iss": "https://test-mock-oidc.replit.app/", "jti": "03a93dffb3a52867e78f1c1c6f948013", "sub": "kEnx1VeFdb", "email": "creatorWI4Rk_@test.com", "auth_time": 1763649548, "last_name": "Smith", "first_name": "Alice"}, "expires_at": 1763653148, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjQ5NTQ4LCJleHAiOjE3NjM2NTMxNDgsInN1YiI6ImtFbngxVmVGZGIiLCJlbWFpbCI6ImNyZWF0b3JXSTRSa19AdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiQWxpY2UiLCJsYXN0X25hbWUiOiJTbWl0aCJ9.uRPSF2EU-hrsDnuOHhM7MRwJLbarWALnnniGpsn-Cp8SgVw2GyU-9gapkESOx8LGQcjwb3s_-BR47OMwq09looDbYzz6xgnKgNb-axrx1tIeik3ab2vdfub9_UYPPvy_XfOMH-hcQyfbCR72QIW7rDpvlMlARsoe0SyveKHYSgQl9upWFIIhyl58yZZtJmEMIYughmzKkSJ80aE1YZ1FS3_WTkubKJXJdHvjeVDfxhef-AjQUskvRMLUMHVJfyguGGsN9DMtB-LJpqju18lMdzuJFiYqGz2_B6rMBBagz15_EsR0WfFStLTCdyGfWU4eufUfYprrPxaufxAGZwpo7Q", "refresh_token": "eyJzdWIiOiJrRW54MVZlRmRiIiwiZW1haWwiOiJjcmVhdG9yV0k0UmtfQHRlc3QuY29tIiwiZmlyc3RfbmFtZSI6IkFsaWNlIiwibGFzdF9uYW1lIjoiU21pdGgifQ"}}}	2025-11-27 14:43:38
8T5AaX8jiNwmeg7PbsQ_TjQuMVahLYbQ	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T12:43:13.153Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763646192, "iat": 1763642592, "iss": "https://test-mock-oidc.replit.app/", "jti": "9745634238c338689dde780ef8738215", "sub": "13PfKg", "email": "userS8CXjb@example.com", "auth_time": 1763642592, "last_name": "User", "first_name": "Test"}, "expires_at": 1763646192, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjQyNTkyLCJleHAiOjE3NjM2NDYxOTIsInN1YiI6IjEzUGZLZyIsImVtYWlsIjoidXNlclM4Q1hqYkBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJUZXN0IiwibGFzdF9uYW1lIjoiVXNlciJ9.gCVU09hplLgwamHU7n1k2RWke30YvNDJTgPzHxECxlj1rOpjaDEV0UhP96UKXABdNauhtHJ1n6oKPtpmVcD9spHv_jQbDPzmjxBzdW5PZsXqzlCFc6HuJ3isshljgJhk5hxW0h2FUvTuJpTXGMLNkzjI4doHDuK4q2D2SSq_YESYcj771BdHFJC1xCRwIT5655dxf5riOJ-3AJJ4JTqZ39hAz6tzbT9s-d7aRxjoxYsNvmiOEQuWC_ePAZaZT94tOiJvOD5Yl24Cy0XmdgqyqmowdGK-b9w4OERZoasYlJrwLoxuZcvkFLs_bTR_HHiNTtgBEVGIJ-fnYqKyR-D1qg", "refresh_token": "eyJzdWIiOiIxM1BmS2ciLCJlbWFpbCI6InVzZXJTOENYamJAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiVGVzdCIsImxhc3RfbmFtZSI6IlVzZXIifQ"}}}	2025-11-27 12:47:42
iRcRNhOZ-8M2lO5oRbM1OCEUaiIK421F	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T12:56:27.350Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763646986, "iat": 1763643386, "iss": "https://test-mock-oidc.replit.app/", "jti": "6a6d59ac5aba478444a5761afe72b749", "sub": "bSKfbp", "email": "xssbSKfbp@example.com", "auth_time": 1763643385, "last_name": "Tester", "first_name": "XSS"}, "expires_at": 1763646986, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjQzMzg2LCJleHAiOjE3NjM2NDY5ODYsInN1YiI6ImJTS2ZicCIsImVtYWlsIjoieHNzYlNLZmJwQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IlhTUyIsImxhc3RfbmFtZSI6IlRlc3RlciJ9.Z7ZPtEXTj8nBiDWMkptXwEtEA5QDGhGJaFqqdrr-otnTbYkRZxq9r_Z3uShiZ4uB0lXfyvtmCwKt2Cf4X-meZaBqKKmSxS_0-HjwrQE_W6qzZ25_VaTljvGqnx-K3UrYt6c3RSpgOqrNyDHwEXTkMAgKEy5KE5KV-exjqW4krQpgl0yzqepEze0BWGuuCKYNcMBM-8FMAZo2IFkiWMixwiO8fKndNiPEDjhSpO5FOQBCeipRoZLPmbFYuYCXIDIigTCurteGIfDzOtVkpWuO7zg0TDpm4IcLC97Beux8jrFDHOsjvoe64lJH37dGTM095W_vUIoxS_v98_cEoPIYRA", "refresh_token": "eyJzdWIiOiJiU0tmYnAiLCJlbWFpbCI6Inhzc2JTS2ZicEBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJYU1MiLCJsYXN0X25hbWUiOiJUZXN0ZXIifQ"}}}	2025-11-27 12:57:03
lCUWO50pTNQIgvBXPY_uP7rZbRIOZgGu	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T18:19:27.089Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763666366, "iat": 1763662766, "iss": "https://test-mock-oidc.replit.app/", "jti": "8504881a7297e74052e99b2906cff976", "sub": "test-user-001", "email": "existing@example.com", "auth_time": 1763662766, "last_name": "User", "first_name": "OAuth"}, "expires_at": 1763666366, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjYyNzY2LCJleHAiOjE3NjM2NjYzNjYsInN1YiI6InRlc3QtdXNlci0wMDEiLCJlbWFpbCI6ImV4aXN0aW5nQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6Ik9BdXRoIiwibGFzdF9uYW1lIjoiVXNlciJ9.Ndwk4CDEjhublvBksZemVT8eTaOGnzAKpGFvVsBkzb7o83y4L043wao9NA8ITDCJJSphprZlquGSj1ZJAZZbJFX-knUkw7F9PXn_FX3chWrL98gKo8VkPOqMWkn9DlKiIUPiVHcpWLyhyA8NT7sajCOTMndvfLZJ6rDKER9kB277080mTUbO74rN5YRLV878sf7uaZNAf1YObW9vTW9oKRnSxvI6jFZ-6zVG_OoFvoJr80AOVxAVO1lqmui3pAiNoehmiW3B9_gqpTpUYVhC-FLdJSUtkxYFv4HcpZMNVuevp3OhA3NIbTC-1XvJJ_CpdsjjrenTSseCog9rznkYfA", "refresh_token": "eyJzdWIiOiJ0ZXN0LXVzZXItMDAxIiwiZW1haWwiOiJleGlzdGluZ0BleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJPQXV0aCIsImxhc3RfbmFtZSI6IlVzZXIifQ"}}}	2025-11-27 18:23:40
vyYBBSKwfW7zD4K9KiTihHK_6B_fYQEm	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-28T15:19:20.309Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763741959, "iat": 1763738359, "iss": "https://replit.com/oidc", "sub": "49819811", "email": "afolinks@outlook.com", "at_hash": "SMfke3ofM0i-oSpHTdYfCw", "username": "afolinks", "auth_time": 1763427241, "last_name": null, "first_name": null}, "expires_at": 1763741959, "access_token": "s6Dw4bcn8uBhC_iaogzI1bM5usk4VFiIuRwH60SQ-tc", "refresh_token": "klTg_3qwWZ0gA4IwWh1wNbpGAYhdYPj-l1MSTtKPfDJ"}}}	2025-11-28 15:22:47
ZxfgoCyyWbqpsd-b1VZDu88oAx81C7jJ	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T14:34:03.981Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763652843, "iat": 1763649243, "iss": "https://test-mock-oidc.replit.app/", "jti": "51c518ad5f535e55a4dccc77d0f055c3", "sub": "5__StCeVsX", "email": "member2uiyRaM@test.com", "auth_time": 1763649243, "last_name": "Johnson", "first_name": "Bob"}, "expires_at": 1763652843, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjQ5MjQzLCJleHAiOjE3NjM2NTI4NDMsInN1YiI6IjVfX1N0Q2VWc1giLCJlbWFpbCI6Im1lbWJlcjJ1aXlSYU1AdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiQm9iIiwibGFzdF9uYW1lIjoiSm9obnNvbiJ9.pCmY7mLg_ixa1DiOYECnT-_zfxmX28jl2FwuqUI49__vjrb2q6WZw6ezQ67EcwX8EsmCk8l-W1zq41SSoAjOuVIQfp2lWothFDUVihUzb5IlcUjXOl5trB08jDnZKTHXgiOcB8WSl9qXQfhztcEEw-rS4loCbG4XgzprsJm_8phe7M8xnTQHSxv8N601bXEn2hi2JWCXDOgXgAYogWsSWC1l7AN1qOwIMjZPFscPoMU9ldUcOauWRZYWn4j5fz75qzt5-yksE8V1pKOq9U8bn3zNSDgMBah-NU684Z_OASl6lGF40b27YHy3G1kWHkQ8En_jp-wy59k1F-HrVBKFpA", "refresh_token": "eyJzdWIiOiI1X19TdENlVnNYIiwiZW1haWwiOiJtZW1iZXIydWl5UmFNQHRlc3QuY29tIiwiZmlyc3RfbmFtZSI6IkJvYiIsImxhc3RfbmFtZSI6IkpvaG5zb24ifQ"}}}	2025-11-27 14:36:13
P_YZx6y3bgsxtckasn2RDgqA7vuIzM1C	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T14:06:49.314Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763651208, "iat": 1763647608, "iss": "https://test-mock-oidc.replit.app/", "jti": "ac26542f6139023089abc3ad102f7a6b", "sub": "N-T8eFrzAx", "email": "creatorVWHxh3@test.com", "auth_time": 1763647607, "last_name": "Smith", "first_name": "Alice"}, "expires_at": 1763651208, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjQ3NjA4LCJleHAiOjE3NjM2NTEyMDgsInN1YiI6Ik4tVDhlRnJ6QXgiLCJlbWFpbCI6ImNyZWF0b3JWV0h4aDNAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiQWxpY2UiLCJsYXN0X25hbWUiOiJTbWl0aCJ9.vgNj1thKQdzr2JfyKp0iOkCtDLjt4kp9HQ33X3-MS6dO5e-MjzpUTZotRfMIuPPF1ioFwJDsCOZdAfo2VmZYUjAp22Sx39maO9pLdHQ-tNaHyIPlTAGc1ghmUcRKVyBmab9-ONaAiDIc9Uu9aGrtVr3xkUg7X3HBA6NlpMExL88P97Xku2LDybCJJvJR_ALWEzV3j-eot_suf_gAZ9RfvGga45R4EP-Ws3ioVnITI7Zs9T9YMnsJr3U6x1TPUuWhYXbF_ByxbZ1sjoEvpzyxDzmOkCMzPU1EB9n6njUnaMMh1H_yoolGiuiutUnsMLRz7CMZUe-4opLi5E30lA2YMQ", "refresh_token": "eyJzdWIiOiJOLVQ4ZUZyekF4IiwiZW1haWwiOiJjcmVhdG9yVldIeGgzQHRlc3QuY29tIiwiZmlyc3RfbmFtZSI6IkFsaWNlIiwibGFzdF9uYW1lIjoiU21pdGgifQ"}}}	2025-11-27 14:22:20
DboGYX3wq-nfagNpyJTV8lZ6UnUjT4If	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T14:18:09.904Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763651888, "iat": 1763648288, "iss": "https://test-mock-oidc.replit.app/", "jti": "846f6e307ee8b9c394f07b9f41764e46", "sub": "uqTHqbIudH", "email": "joiner9l6sxO@test.com", "auth_time": 1763648288, "last_name": "Johnson", "first_name": "Bob"}, "expires_at": 1763651888, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjQ4Mjg4LCJleHAiOjE3NjM2NTE4ODgsInN1YiI6InVxVEhxYkl1ZEgiLCJlbWFpbCI6ImpvaW5lcjlsNnN4T0B0ZXN0LmNvbSIsImZpcnN0X25hbWUiOiJCb2IiLCJsYXN0X25hbWUiOiJKb2huc29uIn0.std9XNluU1wEbGrL6QKbhrcGT6mH_9cdMMKNQBk1mB6ovKeGOEZ6sVR-ATeK_Xgvw1Sj2Mm_TmZnP67tAEU3Gp76EX2Jd3QUFlCytjvHCCaS3H_gBSaP4PxZiqiy--LFcCSwofaQ0LHoEchWgI7og4LXbNHKZWhKO0m9uQ8G40xa_p89IDJsrg23z3hMt8-NJnZ1SbHnA93MlseywvlWcqiZOCrPFKpInVLmLeUkLzlVZlRhs2e8yFGX0Aww3r5_Y0fNyBSTU5KiJJ_Hl99eeZ4zlZjnmnwiRER5DFO3y-L06einNw7Ca-T7VzoVKlbopXyaOYecw2xxUeZfYavtMw", "refresh_token": "eyJzdWIiOiJ1cVRIcWJJdWRIIiwiZW1haWwiOiJqb2luZXI5bDZzeE9AdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiQm9iIiwibGFzdF9uYW1lIjoiSm9obnNvbiJ9"}}}	2025-11-27 14:22:21
TMr4DjWhmwstp0Ft7FN22qyqjp4E9Q2w	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T14:30:59.658Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763652658, "iat": 1763649058, "iss": "https://test-mock-oidc.replit.app/", "jti": "f66b815ca2982117211cd329df28eeea", "sub": "M-QLRMWvRA", "email": "creatorWBTa8d@test.com", "auth_time": 1763649058, "last_name": "Smith", "first_name": "Alice"}, "expires_at": 1763652658, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjQ5MDU4LCJleHAiOjE3NjM2NTI2NTgsInN1YiI6Ik0tUUxSTVd2UkEiLCJlbWFpbCI6ImNyZWF0b3JXQlRhOGRAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiQWxpY2UiLCJsYXN0X25hbWUiOiJTbWl0aCJ9.dzPhS9GSmeHuUzwqGGO7vEHCdj2FGNJ-S-qZ14RG1gr_bbpJTOb1Aapoz8V2Ah4n3bbFE3YQimzDi0KkGo6LbDo06qir3iq7gKnyCEdQCreGbn1dWRu0sgJPD2Nb_STddBFnxbIvawO5tzPSJUUQvjjCnBclygV0CMq9n54O5phxAN0bri6vyG7vJSfQornGiuwylOXq8ZnCEB9H4oi5NrJkSg4F12KawA09mkzmLCQCpJuug0Kpn4vr5S6xe99VH-50yIkdjdCyfKmx6j4fQcH_nDn4YgVAqQAad8INUzJs4R07wDdZmEH3f7QQpnANUIomPxPJLtbC8r2doSVGdA", "refresh_token": "eyJzdWIiOiJNLVFMUk1XdlJBIiwiZW1haWwiOiJjcmVhdG9yV0JUYThkQHRlc3QuY29tIiwiZmlyc3RfbmFtZSI6IkFsaWNlIiwibGFzdF9uYW1lIjoiU21pdGgifQ"}}}	2025-11-27 14:36:14
YPWYbA2497c4FM8twz0ouBSsNZXVhR_E	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T15:02:35.781Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763654554, "iat": 1763650954, "iss": "https://test-mock-oidc.replit.app/", "jti": "b185ef37941bd74b1033a719feed88aa", "sub": "FRs9M-", "email": "FRs9M-@example.com", "auth_time": 1763650954, "last_name": "Doe", "first_name": "John"}, "expires_at": 1763654554, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjUwOTU0LCJleHAiOjE3NjM2NTQ1NTQsInN1YiI6IkZSczlNLSIsImVtYWlsIjoiRlJzOU0tQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IkpvaG4iLCJsYXN0X25hbWUiOiJEb2UifQ.WBLhpe2T3UHQGKriln_28ECtMn950AlotGULEGEUpyvL5xdhWjldwE_5XUJL6dfqZY2ow4z0HvAnodxgRBsUTf-DeLh4n1t99nyJN3XBT0BcLUdQtTjiMtPEVh_X2XyHg_gomX8Zr2YDfgftqYTr5x--yjt5Y6BB7xs66j7rTzKfoRHSw1FLYDzz5txSm_DjpzEM8FiUOLJAtbb1nSgrP503w3C0_wkbRW9naA1RsQPutymGOy4ACWWpcJXtK-DCyYxYlkaxH_-GQLgj6BBQIs884GgbK2XGdRJUsQ6QlyHTF07hgh-ii4LswSHwD0XsrG-9x2yOtuCUsHbqiPAxOA", "refresh_token": "eyJzdWIiOiJGUnM5TS0iLCJlbWFpbCI6IkZSczlNLUBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJKb2huIiwibGFzdF9uYW1lIjoiRG9lIn0"}}}	2025-11-27 15:04:29
KdgoGrxcpAXoRSVZlmHitnNWuyquGZmO	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T13:10:10.949Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "f7c7216a-1cec-4749-a319-dcc27441f449", "exp": 1763647809, "iat": 1763644209, "iss": "https://test-mock-oidc.replit.app/", "jti": "405b05f720ebf45812a93719a8c7106e", "sub": "_9i_VgLhrP", "email": "memberpGXqLw@test.com", "auth_time": 1763644209, "last_name": "Joiner", "first_name": "David"}, "expires_at": 1763647809, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYzNjQ0MjA5LCJleHAiOjE3NjM2NDc4MDksInN1YiI6Il85aV9WZ0xoclAiLCJlbWFpbCI6Im1lbWJlcnBHWHFMd0B0ZXN0LmNvbSIsImZpcnN0X25hbWUiOiJEYXZpZCIsImxhc3RfbmFtZSI6IkpvaW5lciJ9.fg59Kjv5rlqnKKSmP_u0C3zeCqszaEOLGkfRMAsO0lbn5xYje9xKqKhEuaJcodf7QOkGjHDscHstCoEV9eID9eTozq3_jVAQBPnuJiZHIiJX5BfK1cXtP5bt667j7ehyRWe5KVcS29xyol6svM-QeJaVkwhIEvu-hszo01bEKOUBAyil8UEEd89YkVKsEjV9wcor3wheuoEiU6c8MOZo1X-XFdjQs0KBABTJbVT59tSJiJaYKSrsfGp7RdLMbJvfjCra6RjhzFbAqtyLjE7CPEwWQkjec_NZkHp_PeNsus2isv864-RyZTUTNtfJGXMqLrIO2-zlaSi4y_KNg_tZJw", "refresh_token": "eyJzdWIiOiJfOWlfVmdMaHJQIiwiZW1haWwiOiJtZW1iZXJwR1hxTHdAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiRGF2aWQiLCJsYXN0X25hbWUiOiJKb2luZXIifQ"}}}	2025-11-27 13:10:48
\.


--
-- Data for Name: user_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_settings (id, user_id, theme, inactivity_timeout_enabled, inactivity_timeout_minutes, biometric_enabled, push_notifications_enabled, email_notifications_enabled, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, first_name, last_name, profile_image_url, created_at, updated_at, phone, about_me, local_bank_account_name, local_bank_account_number, local_bank_name, international_bank_account_name, international_bank_account_number, international_bank_swift_code, international_bank_iban, preferred_name, local_bank_sort_code, is_admin, status, deleted_at, restricted_until, avatar_choice, gender, deletion_count, password_hash, auth_provider, auth_provider_id, password_reset_token, password_reset_expires, total_funds_ngn, total_funds_gbp, total_funds_usd, total_funds_eur, clerk_user_id) FROM stdin;
901c4804-1f64-4043-9bd0-8929f582fb67	test_8mvbbc@example.com	Test	User	\N	2025-11-20 20:44:05.447748	2025-11-20 20:44:05.447748	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$FMPzcsjf3h4kopJ.YXC1K..GSRVDgna3nIj6c1Z6VMJMSZmoFSAea	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
2fb6ce29-391a-4406-bcd8-318f9f851f1b	authtest_tzf_ms@example.com	Auth	Test	\N	2025-11-20 20:49:01.82638	2025-11-20 20:49:01.82638	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$CQL08cxehLrbpH1aT3NO7.WgFjkTAE.FFVJJI2LT3lgMgcAFebVea	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
d6a29c0b-f5fe-4099-a000-bed66a511018	jwttest_pa9i_m@example.com	JWT	Tester	\N	2025-11-20 20:52:16.172346	2025-11-20 20:52:16.172346	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$nhsdd32qhi9ZkUnx2ffaXefHhHJ/9i/cxH8zrb4AXfAmpxglksgbK	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
95c20164-d9af-4592-9d9b-cff2a570106d	final_-gegbg@example.com	Final	Test	\N	2025-11-20 20:55:49.259723	2025-11-20 20:55:49.259723	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$IHq9HKfW3DTdx/fvImrPNOCBBNETxmO1Lf3QDLqoPNpaj3LCG9dXi	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
38f0636b-add2-422a-8bf7-4cc372cb1800	dualauth_xfznb8@example.com	Dual	Auth	\N	2025-11-20 21:02:15.127357	2025-11-20 21:02:15.127357	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$jJZ5rB9wV5gdE0t1iHyjeuLi2cingCChqByP/ZsDjvefZDvTUXWrK	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
ef9af297-b4ab-4824-9035-009b73bf7080	johndoe@example.com	John	Doe	\N	2025-11-25 19:40:23.927235	2025-11-25 19:40:23.927235	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$RzQfMu7om47v8U/TF7kOheAt8kmfVm/g9xrdrvu6.rZWJC2C8K3DW	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
3977bd52-465b-4356-862b-d0a5c3f9b777	zerfou@example.com	Jane	Mobile	\N	2025-11-25 19:42:17.701155	2025-11-25 19:42:17.701155	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$h98QnhazFgTgk8MZJEZ54udLJow9Iyoe1qF7laAc8prJslAoU/H.O	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
481e91e3-c87a-44b1-b0ab-032a71a9f084	testadmin1764105534655@example.com	Test	Admin	\N	2025-11-25 21:19:10.848758	2025-11-25 21:19:10.848758	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$3Aj3siE.m8w1y9tdfsTeS.S8n3gD7J/TP2GwPMTbMxIwn1R/qcSXW	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
420eb3f1-baec-4645-ae56-682a5ecbcc34	testuser-ed_jok@example.com	Test	User	\N	2025-11-25 17:52:06.375172	2025-11-25 17:52:06.375172	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
7230902e-ef2d-41b0-8090-d085184e6837	icol2e@example.com	John	Doe	\N	2025-11-25 18:20:32.801032	2025-11-25 18:20:32.801032	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$Gf76sQXpk0MPBp9l3.8FJ.X9Yd2Ihz8RId/XDvxrziKBG9pzexKs6	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
0eaa44b7-5f2a-4687-8ad0-8c0a2255252e	test-ynl0w74l@example.com	John	Doe	\N	2025-11-25 18:25:38.349431	2025-11-25 18:25:38.349431	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$dGeZhArdaPck.qGHt9umiu7ih1g97nSomqt65NhMQbrSXdA4DDaua	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
41d35875-60c8-47b7-b744-43c7805e17bb	bw942r@example.com	John	Doe		2025-11-25 18:32:40.669876	2025-11-25 18:33:21.634	+2348012345678	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N		\N	0	$2b$10$Bm5RT53W4DOT7j9N9tQJaeeyqNfjFmKdod/ExBoxIK/29DwDlPW0m	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
7b1f99a8-fdad-4a6c-87ac-c1cfe07df881	iss4ro@example.com	John	Doe	\N	2025-11-25 18:35:58.576934	2025-11-25 18:35:58.576934	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$hAniQ7iozPGIp7ZUHbrO5uLerM3bHt3vnIV2IMNQJVs3UbCjjHOEa	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
8cb116aa-5f49-4cc2-b9c1-e956dafe97cd	jc0q3j@example.com	Jane	Doe	\N	2025-11-25 18:44:03.890263	2025-11-25 18:44:03.890263	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$XHw.O7as4K5CDUGAMsjck.zF9RrLGy28fz.2e2LsvaUQ2dOqlda0i	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
4733e4be-3a1b-466d-850e-96d7a93c35d8	testowner@example.com	Test	Owner	\N	2025-11-23 14:53:21.028319	2025-11-23 14:53:21.028319	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$uBbbicIfA2R9RdPtpY9IA.ppCnwVwibVHsf5P2InYLld0ID0ODZo6	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
e2bbe7d6-e425-4928-b4ed-c22cccbacd06	testowner2@example.com	Test Owner	2	\N	2025-11-23 14:58:46.857184	2025-11-23 14:58:46.857184	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$4qhfDHiJSRLTs1wY8siAtOFJSwxL5F5vW5ZrOEnp5B.Fh6b7pSnre	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
cd7e6678-f5f6-486f-a5a9-1439ddb39d70	finaltest@example.com	Final Test	Owner	\N	2025-11-23 15:06:09.913117	2025-11-23 15:06:09.913117	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$OYS71M8SxXGLeVBVOHOvVeqxuWkS1NU.gxwPkEb0AKN5Jz0fylgyO	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
6be8ed1e-b584-4122-970d-557bf80ea1b2	uitest@example.com	UI Test	User	\N	2025-11-23 17:50:20.704887	2025-11-23 17:50:20.704887	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$D8mV73VFKPBVaE5Sn3Pe1u30.kUl3vmYEG/a2IKnhjVRyGv.STI3W	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
ea8fc431-be93-417f-a94a-23b877b5d0f1	datefix@example.com	Collection Date Fix Test	Doe	\N	2025-11-23 17:54:53.734115	2025-11-23 17:54:53.734115	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$VdTV4NS2vdswdPnnnCaqBeXxy4rqZUBbH3/gs3z.JNMEHUmZfEJay	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
6e5d8182-2e7f-4eef-85cf-4f9f9fbd4a3c	logictest@example.com	Logic Test	User	\N	2025-11-23 18:32:45.613684	2025-11-23 18:32:45.613684	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$S.EeAYrQJeOXusyFZEE8.ePHkoZr0XIeJodHwg7B3hOU.lR1vzddG	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
1d5a8b7b-6893-4115-80fa-c9b9a42c1c85	timelinetest@example.com	Timeline	Test User	\N	2025-11-24 16:06:51.359929	2025-11-24 16:06:51.359929	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$CRPdlObiFJI3FwLzP.lkWOGqHww3nS3WgxlGVCb0ceSW36drMJwMi	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
6a56d718-e072-4596-a1d5-21fe8e1be4cc	finalcheck@example.com	Final Check	User	\N	2025-11-24 16:12:20.396824	2025-11-24 16:12:20.396824	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$g56GitmdGEVWfM4VRP/eJOrEjvGGWZbWNW/fIOPUOZpP/O0MH3KRi	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
2e396f00-a002-49f2-8c38-ea419fdfe03a	validtest@example.com	Validation Test	User	\N	2025-11-24 16:17:21.496411	2025-11-24 16:17:21.496411	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$PCQUwAxwWptWhwWK1h2mAuN/ROtlK4m8UWrnNxMdy6/i0tNompveW	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
admin-test-001	admin@kudiloop.com	Admin	User	\N	2025-11-24 19:06:01.542441	2025-11-24 19:06:01.542441	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	active	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	0.00	0.00	0.00	0.00	\N
ea4a0548-1762-46bd-96ae-83ff76f19d26	l_0kl5@example.com	Jane	Doe	\N	2025-11-25 18:46:29.376744	2025-11-25 18:46:29.376744	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$y67kh8W.VurF4Zk99ewb6eyvjOmvgta3PLaKRXDb1o3OqezKCgFFu	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
450e42f4-df0c-40d6-9eea-21d89b8c0f0e	ssvdau@example.com	John	Doe	\N	2025-11-26 14:17:07.396698	2025-11-26 14:17:07.396698	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$ZihbOd.TjfCRZH19RyCQB./Cne4msI7LOl/xfwfHzXO18S3gEaNYm	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
8ce1af50-cbaf-4822-b9ff-0dd364427e7b	mkh71i@example.com	John	Doe	\N	2025-11-25 18:53:09.648765	2025-11-25 18:53:09.648765	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$GNG11PEfGK2gciZIv5Zo0eOz.JiiWwmLCaZ1FiGcmmai1vwAPMUyG	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
9afe2326-fe00-46cc-aa4b-8732e45c5cc7	carousel_-zo9az@example.com	Carousel	Tester	\N	2025-11-25 19:00:09.36979	2025-11-25 19:00:09.36979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$Mhn1I0jODSUGbSc3x6kuyeyAEthX1LU7xoucsnWMk3lQF4SknBsQa	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
d40f741e-d6ad-4af0-ab7a-dea2c89fa609	fhfa1y@example.com	John	Doe	\N	2025-11-25 19:12:21.046988	2025-11-25 19:12:21.046988	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$yLXut/wa9rjBh26XynrBdu3q.psynwbV70pvNja6gOkkTSr0RM85S	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
d6a8ab57-b885-4768-9aca-b7c9926c3151	kudiloop_test_gtwpcbly@example.com	Test	User	\N	2025-11-25 19:25:56.481929	2025-11-25 19:25:56.481929	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$EiEZ0g9n0pKVyZmZQV/fu.j9l.jDRh2RZExXTm2UGMyQ5AagGvSPO	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
YVQaHI	testusert9EXpZ@example.com	Test	User	\N	2025-11-28 13:52:47.390695	2025-11-28 13:52:47.390695	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	0.00	0.00	0.00	0.00	\N
52c63dc2-01a3-41a8-b632-32cab7a480f3	testusert9expz@example.com	Test	User	\N	2025-11-28 13:53:15.881837	2025-11-28 13:53:15.881837	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$Cw5r3RNBPTJ8wkQ2YjZfhu/BDyoYTpY6TJVmMpVmEnXuhVohELpIK	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
55a302a3-05bb-45dd-a298-c90cd9a00cd8	testexport6l8ovc@example.com	Test	Export	\N	2025-11-28 14:51:18.166638	2025-11-28 14:51:18.166638	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$kJ8YVo/O1uxuER4ZN7hsgeBXz4sC9Jh6JrIYhBbq/p8PNtIcCBQfS	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
2c4d4513-10b4-4442-b476-9cbe6055df76	itteam@algoscapeinnovat.io	IT	Team	\N	2025-12-03 21:21:13.933289	2026-01-02 18:42:48.935			\N	\N	\N	\N	\N	\N	\N	IT	\N	0	active	\N	\N	neutral_2	prefer_not_to_say	0	\N	clerk	\N	\N	\N	0.00	0.00	0.00	0.00	user_36LrofZUIyV9REEM4oBDGPctTGX
49819811	afolinks@outlook.com	Afolabi	Ajao	\N	2025-11-17 16:40:14.507557	2026-01-02 18:43:27.31	+447846779604		gefgyfghfh	56555565	abc	\N	\N	\N	\N	Fola	\N	1	active	\N	\N	male_6	male	0	$2b$10$e3DLZkv4YTHj7itkjBvbF.pYJVsouLlyits6OLltNOWos7FroVCPu	\N	\N	\N	\N	0.00	0.00	0.00	0.00	user_36QFk7x2S81ObxEGx7azvymAcaF
\.


--
-- Name: audit_events audit_events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_events
    ADD CONSTRAINT audit_events_pkey PRIMARY KEY (id);


--
-- Name: contributions contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_pkey PRIMARY KEY (id);


--
-- Name: data_exports data_exports_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.data_exports
    ADD CONSTRAINT data_exports_pkey PRIMARY KEY (id);


--
-- Name: device_tokens device_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: invite_links invite_links_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invite_links
    ADD CONSTRAINT invite_links_pkey PRIMARY KEY (id);


--
-- Name: invite_links invite_links_token_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invite_links
    ADD CONSTRAINT invite_links_token_unique UNIQUE (token);


--
-- Name: join_requests join_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.join_requests
    ADD CONSTRAINT join_requests_pkey PRIMARY KEY (id);


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: partner_clicks partner_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partner_clicks
    ADD CONSTRAINT partner_clicks_pkey PRIMARY KEY (id);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: payment_receipts payment_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_receipts
    ADD CONSTRAINT payment_receipts_pkey PRIMARY KEY (id);


--
-- Name: pot_transactions pot_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pot_transactions
    ADD CONSTRAINT pot_transactions_pkey PRIMARY KEY (id);


--
-- Name: savings_pots savings_pots_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.savings_pots
    ADD CONSTRAINT savings_pots_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_unique UNIQUE (user_id);


--
-- Name: users users_clerk_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_clerk_user_id_unique UNIQUE (clerk_user_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: idx_audit_events_action; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_events_action ON public.audit_events USING btree (action, created_at);


--
-- Name: idx_audit_events_actor; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_events_actor ON public.audit_events USING btree (actor_id, created_at);


--
-- Name: idx_audit_events_target; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_events_target ON public.audit_events USING btree (target_user_id, created_at);


--
-- Name: idx_data_exports_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_data_exports_status ON public.data_exports USING btree (status);


--
-- Name: idx_data_exports_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_data_exports_user ON public.data_exports USING btree (user_id);


--
-- Name: idx_device_tokens_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_device_tokens_active ON public.device_tokens USING btree (is_active);


--
-- Name: idx_device_tokens_token; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_device_tokens_token ON public.device_tokens USING btree (token);


--
-- Name: idx_device_tokens_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_device_tokens_user ON public.device_tokens USING btree (user_id);


--
-- Name: idx_groups_created; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_groups_created ON public.groups USING btree (created_at);


--
-- Name: idx_groups_currency; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_groups_currency ON public.groups USING btree (currency);


--
-- Name: idx_groups_frequency; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_groups_frequency ON public.groups USING btree (frequency);


--
-- Name: idx_groups_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_groups_status ON public.groups USING btree (status);


--
-- Name: idx_join_requests_group; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_join_requests_group ON public.join_requests USING btree (group_id, status);


--
-- Name: idx_join_requests_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_join_requests_user ON public.join_requests USING btree (user_id, status);


--
-- Name: idx_messages_group_created; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_messages_group_created ON public.messages USING btree (group_id, created_at);


--
-- Name: idx_messages_recipient_created; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_messages_recipient_created ON public.messages USING btree (recipient_id, created_at);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_sent; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notifications_sent ON public.notifications USING btree (sent_at);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_partner_clicks_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_partner_clicks_date ON public.partner_clicks USING btree (clicked_at);


--
-- Name: idx_partner_clicks_partner; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_partner_clicks_partner ON public.partner_clicks USING btree (partner_id);


--
-- Name: idx_partner_clicks_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_partner_clicks_user ON public.partner_clicks USING btree (user_id);


--
-- Name: idx_partners_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_partners_active ON public.partners USING btree (is_active);


--
-- Name: idx_partners_category; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_partners_category ON public.partners USING btree (category);


--
-- Name: idx_pot_transactions_pot; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pot_transactions_pot ON public.pot_transactions USING btree (pot_id, created_at);


--
-- Name: idx_pot_transactions_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pot_transactions_user ON public.pot_transactions USING btree (user_id, created_at);


--
-- Name: idx_pots_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pots_user ON public.savings_pots USING btree (user_id);


--
-- Name: idx_receipts_group_cycle; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_receipts_group_cycle ON public.payment_receipts USING btree (group_id, cycle_number);


--
-- Name: idx_receipts_member; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_receipts_member ON public.payment_receipts USING btree (member_id);


--
-- Name: idx_user_settings_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_settings_user ON public.user_settings USING btree (user_id);


--
-- Name: idx_users_created; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_users_created ON public.users USING btree (created_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: audit_events audit_events_actor_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_events
    ADD CONSTRAINT audit_events_actor_id_users_id_fk FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: audit_events audit_events_target_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_events
    ADD CONSTRAINT audit_events_target_user_id_users_id_fk FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contributions contributions_group_id_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_group_id_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: contributions contributions_member_id_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_member_id_members_id_fk FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: data_exports data_exports_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.data_exports
    ADD CONSTRAINT data_exports_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: device_tokens device_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: groups groups_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: invite_links invite_links_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invite_links
    ADD CONSTRAINT invite_links_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: invite_links invite_links_group_id_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invite_links
    ADD CONSTRAINT invite_links_group_id_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: join_requests join_requests_group_id_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.join_requests
    ADD CONSTRAINT join_requests_group_id_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: join_requests join_requests_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.join_requests
    ADD CONSTRAINT join_requests_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: members members_group_id_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_group_id_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: members members_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: messages messages_group_id_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_group_id_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: messages messages_recipient_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_recipient_id_users_id_fk FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: partner_clicks partner_clicks_partner_id_partners_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partner_clicks
    ADD CONSTRAINT partner_clicks_partner_id_partners_id_fk FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;


--
-- Name: partner_clicks partner_clicks_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partner_clicks
    ADD CONSTRAINT partner_clicks_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payment_receipts payment_receipts_group_id_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_receipts
    ADD CONSTRAINT payment_receipts_group_id_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: payment_receipts payment_receipts_member_id_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_receipts
    ADD CONSTRAINT payment_receipts_member_id_members_id_fk FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: payment_receipts payment_receipts_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_receipts
    ADD CONSTRAINT payment_receipts_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pot_transactions pot_transactions_pot_id_savings_pots_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pot_transactions
    ADD CONSTRAINT pot_transactions_pot_id_savings_pots_id_fk FOREIGN KEY (pot_id) REFERENCES public.savings_pots(id) ON DELETE CASCADE;


--
-- Name: pot_transactions pot_transactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pot_transactions
    ADD CONSTRAINT pot_transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: savings_pots savings_pots_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.savings_pots
    ADD CONSTRAINT savings_pots_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_settings user_settings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict 213XZSXgnQC9iqAcVAqxktsoejdCwAyu8GarU9R2RXY0bqIawqwRg0xZaudM1Se

